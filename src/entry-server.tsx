// SSR 入口：构建期把每个路由预渲染成真实 HTML（GitHub Pages 子路径 200 + 分享卡片可用）
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'

export { getAllJobs } from './content/jobs'

export function render(url: string): string {
  return renderToString(
    <StaticRouter basename={import.meta.env.BASE_URL} location={url}>
      <App />
    </StaticRouter>,
  )
}
