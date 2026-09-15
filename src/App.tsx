import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

// 文档页是唯一依赖 react-markdown / highlight.js 的页面（约 117KB gzip），
// 静态引入会把它拖进首页首屏。改为访问栏目时才按需加载。
const SectionPage = lazy(() => import('./pages/SectionPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:section" element={<SectionPage />} />
        <Route path="/:section/:slug" element={<SectionPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
