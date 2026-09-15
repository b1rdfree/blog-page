import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from '../components/NavBar'
import SiteBackground from '../components/SiteBackground'

export default function MainLayout() {
  return (
    <>
      {/* 背景挂在布局层而不是页面里：切路由时 MainLayout 不卸载，
          canvas 只初始化一次，所有页面共享同一片背景。 */}
      <SiteBackground />

      <div className="app-shell">
        <NavBar />
        <main className="app-main">
          {/* 路由级按需加载的落点：NavBar 常驻，只替换内容区 */}
          <Suspense fallback={<div className="route-loading">加载中…</div>}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="app-footer">
          <span>Nonight Hub</span>
          <span className="app-footer-dot">·</span>
          <span>Vite + React + Markdown</span>
        </footer>
      </div>
    </>
  )
}
