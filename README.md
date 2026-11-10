# Quant Hunter — 个人猎头主页（quant-hunter-site）

Austin Cui 的个人猎头主页 / 量化招聘静态网站，部署在 GitHub Pages：
**https://austin-cui.github.io/quant-hunter/**

用于在小红书 / 领英 / 脉脉等平台展示个人品牌、在招岗位（每个岗位有独立链接可直接转发），并接收候选人投递与简历登记。

## 技术栈

- React 18 + Vite + TypeScript
- Tailwind CSS 3 + shadcn/ui 组件
- React Router（`/jobs/:slug` 岗位详情页）
- 支持白天 / 夜间模式（导航栏切换，localStorage 记忆）
- 预渲染插件（构建时生成各路由静态 HTML + sitemap.xml）

## 目录结构

```
src/
  config/site.ts        # ★ 全站唯一配置入口：姓名/联系方式/社交账号/FAQ/隐私文案
  content/jobs/index.ts # ★ 在招岗位清单（唯一数据源：上架/下架/改JD 都只改这里）
  content/cases/        # 成功案例数据（2026-11-10 起不在页面展示，仅保留备查）
  pages/                # 页面：首页/岗位列表/岗位详情/404
  sections/             # 首页区块：Hero/岗位/案例/FAQ/登记
  components/site/      # 导航栏、页脚、主题切换、管理入口等
  lib/submit.ts         # 投递提交（Cloudflare Worker，含重试与幂等）
public/
  qr/                   # 微信/脉脉二维码图片
  .nojekyll             # 必须存在！否则 GitHub Pages 用 Jekyll 构建会失败
publish.py              # 在工作区根目录：发布唯一入口（见下）
```

## 常用操作

改任何内容后发布（在工作区根目录执行）：

```bash
cd quant-hunter-site
npm run build
cp dist/index.html dist/404.html
cp public/.nojekyll dist/.nojekyll   # build 会清空 dist，需补拷
cd ..
python publish.py                     # 同步到 gh-pages 并等待 Pages 构建完成
```

- 改个人信息 / FAQ / 社交账号 → 只改 `src/config/site.ts`
- 岗位上架 / 下架 / 改 JD → 只改 `src/content/jobs/index.ts`（slug 外发后不要改）
- 加成功案例 → 在 `src/content/cases/` 新建 `case-*.ts` 照格式写一段

## 投递后端（不在本仓库）

- Cloudflare Worker：`quant-hunter-api/`（工作区根目录旁），D1 存投递记录、R2 存简历附件
- 接口：`POST /api/submit`（公开投递）、`/api/login`、`/api/submissions`、`/api/unread-count`、`/api/resume/:path`
- 投递查看与管理：**不在本网站**，统一走「候选人管家」的岗位库页面（2026-11-10 移除本站 /admin，避免功能重叠）
- ⚠️ workers.dev 域名在国内被墙：候选人投递需要 VPN，页面上已注明

## 注意事项

- `.gh-token`（GitHub 部署令牌）在工作区根目录，**严禁提交进本仓库**（已列入 .gitignore 的检查范围）
- 本仓库只做版本管理，发布仍走 `publish.py`（它推送的是构建产物 dist/）
