---
title: Vite 项目部署到 GitHub Pages
date: 2026-09-11
order: 2
tags: [vite, 部署, github]
summary: base、.nojekyll、Actions 三个关键点，一次配好。
---

# Vite 项目部署到 GitHub Pages

## 三个必须注意的点

### 1. base 路径

项目站地址带子路径 `/<仓库名>/`，Vite 默认按根路径生成资源引用，不配就是白屏。

```ts
// vite.config.ts
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
})
```

构建时传入：`VITE_BASE=/你的仓库名/ npm run build`

### 2. .nojekyll

GitHub Pages 默认用 Jekyll 渲染，会忽略所有下划线开头的目录。`_next/`、`_nuxt/` 这类产物目录会被直接丢掉，导致 JS/CSS 全部 404。

在 Actions 里加一步：

```yaml
- run: touch dist/.nojekyll
```

### 3. SPA fallback

静态服务器没有 fallback 时，刷新子路径会 404。两个办法二选一：

- 用 `HashRouter`（最简单，本项目默认方案）
- 把 `index.html` 复制一份改名 `404.html`

## 完整 workflow

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_BASE: /${{ github.event.repository.name }}/
      - run: touch dist/.nojekyll
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```
