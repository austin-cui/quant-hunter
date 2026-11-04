// 构建后预渲染：把每个路由渲染成真实 HTML 文件 + 生成 sitemap.xml / robots.txt
// 效果：GitHub Pages 对 /jobs、/jobs/<slug> 返回 200 和完整内容（微信/搜索引擎可抓取），
//       页面外观与行为与 SPA 完全一致（客户端照常 hydration）。
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const SSR_DIR = path.join(ROOT, 'dist-ssr')
const ORIGIN = 'https://austin-cui.github.io/quant-hunter'
const BASE = '/quant-hunter/'

// ---- 1) 构建 SSR 包 ----
await build({
  configFile: false,
  root: ROOT,
  base: BASE,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(ROOT, 'src') } },
  logLevel: 'warn',
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: 'dist-ssr',
    rollupOptions: { input: 'src/entry-server.tsx' },
  },
})
const { render, getAllJobs } = await import(pathToFileURL(path.join(SSR_DIR, 'entry-server.js')).href)

// ---- 2) 渲染每个路由 ----
const jobs = getAllJobs()
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const meta = {
  '/': {
    title: 'Quant Hunter | 量化人才猎头',
    description: '专注量化、机器学习与金融科技领域的人才招聘：最新在招岗位、匿名成功案例与候选人登记。每个岗位均有独立链接，可直接转发。',
  },
  '/jobs': {
    title: `在招岗位（${jobs.length}） | Quant Hunter`,
    description: '量化、机器学习与金融科技领域最新在招岗位：量化研究、量化开发、高频交易。每个岗位均有独立链接，可直接转发。',
  },
}
for (const j of jobs) {
  meta[`/jobs/${j.slug}`] = {
    title: `${j.title} | Quant Hunter`,
    description: j.summary || `${j.title}｜${j.companyLabel}｜${j.location}`,
  }
}

const template = readFileSync(path.join(DIST, 'index.html'), 'utf-8')
const inject = (route, appHtml) => {
  const m = meta[route]
  let html = template.replace('<!--app-html-->', appHtml)
  html = html.replace(/<meta property="og:[^"]*"[^>]*>/g, '')   // 防重复注入（重复运行时）
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(m.title)}</title>`)
  const og = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${ORIGIN}${BASE.slice(0, -1)}${route === '/' ? '/' : route}">`,
  ].join('')
  return html.replace('</head>', `  ${og}\n  </head>`)
}

const routes = ['/', '/jobs', ...jobs.map((j) => `/jobs/${j.slug}`)]
const written = []
for (const route of routes) {
  const appHtml = render(BASE.slice(0, -1) + route)
  const html = inject(route, appHtml)
  if (route === '/') {
    writeFileSync(path.join(DIST, 'index.html'), html)
    // 404 页保持空壳（未匹配路径不展示具体页面内容）
    writeFileSync(path.join(DIST, '404.html'), template.replace('<!--app-html-->', ''))
  } else {
    const dir = path.join(DIST, route.slice(1))
    mkdirSync(dir, { recursive: true })
    writeFileSync(path.join(dir, 'index.html'), html)
  }
  written.push(route)
}

// ---- 3) sitemap.xml + robots.txt ----
const today = new Date().toISOString().slice(0, 10)
const urls = [
  { loc: `${ORIGIN}/`, lastmod: today, priority: '1.0' },
  { loc: `${ORIGIN}/jobs`, lastmod: today, priority: '0.8' },
  ...jobs.map((j) => ({ loc: `${ORIGIN}/jobs/${j.slug}`, lastmod: j.postedAt || today, priority: '0.8' })),
]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`
writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap)

const robots = `User-agent: *
Allow: /
Disallow: /flow/
Disallow: /qr/

Sitemap: ${ORIGIN}/sitemap.xml
`
writeFileSync(path.join(DIST, 'robots.txt'), robots)

rmSync(SSR_DIR, { recursive: true, force: true })
console.log(`prerender ok: ${written.length} routes (404.html / sitemap.xml / robots.txt generated)`)
