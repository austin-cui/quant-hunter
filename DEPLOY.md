# Quant Hunter 个人猎头网站 · 部署与维护指南

**线上地址：https://austin-lip.github.io/quant-hunter/**
仓库：https://github.com/Austin-lip/quant-hunter （main = 源码，gh-pages = 构建产物）

## 一、日常更新（最常用）

### 发布一个新岗位

1. 复制任意一个 `src/content/jobs/job-*.ts` 文件，改名如 `job-xxx.ts`
2. 按 `src/types/job.ts` 里的字段说明修改内容（slug 必须唯一，建议小写+连字符）
3. 重新构建并部署 —— 岗位会自动出现在列表页，链接为 `https://austin-lip.github.io/quant-hunter/jobs/<slug>`

> 下架岗位 = 删除对应文件。不需要改任何其它代码。

### 修改个人信息 / 口号 / FAQ / 联系方式

只改一个文件：`src/config/site.ts`（所有字段都有中文注释）。

### 重新部署（改完任何内容后）

```bash
cd quant-hunter-site
npm run build
cp dist/index.html dist/404.html
cd ..
python deploy.py          # 需要 .gh-token 文件存在（见第四节）
```

> ⚠️ 构建基路径已硬编码在 `vite.config.ts`（`/quant-hunter/`），不要用环境变量方式传，
> Git Bash 会把 `/quant-hunter/` 自动转换成 Windows 路径导致部署后白屏。

## 二、绑定自己的域名（可选，第二步再做）

- GitHub Pages 支持绑定自定义域名（Settings → Pages → Custom domain），自动签发 HTTPS。
- 境外托管无需 ICP 备案，即买即用。国内注册商购买的域名也可直接解析过来。

## 三、本地开发

```bash
npm install
npm run dev        # http://localhost:3000（本地 base=/，不受 GitHub Pages 基路径影响）
npm run build      # 生产构建到 dist/（base=/quant-hunter/）
```

## 四、访问令牌说明（安全）

- `deploy.py` 依赖本目录下的 `.gh-token` 文件（GitHub 细粒度个人访问令牌，
  仅授权 `quant-hunter` 仓库的 Contents/Pages 读写，**2026-10-28 自动过期**）。
- 过期后如需重新部署：GitHub → Settings → Developer settings →
  Fine-grained tokens → Generate new token（只选 quant-hunter 仓库，
  Contents 和 Pages 给 Read and write），把令牌粘贴覆盖 `.gh-token` 文件即可。
- 如果想立刻作废：GitHub 令牌列表页删除 `quant-hunter-deploy`。

## 五、模块化结构（方便二次开发）

```
src/
├── config/site.ts          # ★ 全站配置中心：姓名/联系方式/社交账号/FAQ/数据看板
├── types/job.ts            # 岗位数据类型定义（数据契约）
├── content/jobs/           # ★ 岗位库：一个岗位一个文件，自动收录排序
│   └── index.ts            #    自动收集器（import.meta.glob），一般不用动
├── components/site/        # 通用组件：导航 / 页脚 / 岗位卡片 / 分享按钮 / 区块标题
├── sections/               # 首页各区块（英雄区/数据/岗位/领域/案例/流程/FAQ/登记）
├── pages/                  # 页面：首页 / 岗位列表 / 岗位详情 / 404
└── App.tsx                 # 路由总装
```

想加新功能（行业动态页、候选人测评页、数据统计模块），照这个分层加文件即可。
