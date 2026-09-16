import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { travelIndexPlugin } from './build/travelIndexPlugin.ts'

export default defineConfig({
  plugins: [
    react(),
    // 扫描旅行数据集，构建期生成轻量索引（详见 build/travelIndexPlugin.ts）
    travelIndexPlugin(fileURLToPath(new URL('./src/content/travel', import.meta.url))),
  ],
  base: process.env.VITE_BASE ?? '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  // Vite 8 起打包器换成 Rolldown：manualChunks 对象形式已移除，
  // 改用 rolldownOptions.output.codeSplitting
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
              priority: 20,
            },
            {
              name: 'anim',
              test: /[\\/]node_modules[\\/](motion|framer-motion|gsap|@gsap)[\\/]/,
              priority: 15,
            },
            {
              // ogl 单独成组：它只被异步加载的 Plasma 背景引用，
              // 混进 anim 会被首页首屏一起 preload。
              name: 'plasma',
              test: /[\\/]node_modules[\\/]ogl[\\/]/,
              priority: 16,
            },
            {
              name: 'markdown',
              test: /[\\/]node_modules[\\/](react-markdown|remark-gfm|rehype-highlight|rehype-slug|highlight\.js)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
