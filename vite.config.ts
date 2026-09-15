import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
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
