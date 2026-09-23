import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { getNavItem } from '../config/nav'
import NavBar from '../components/NavBar'
import SiteBackground from '../components/SiteBackground'
import { useTheme } from '../lib/useTheme'
import ContentBoundary from '../components/ContentBoundary'

export default function MainLayout() {
  const { theme, preference, chooseTheme } = useTheme()
  const { pathname } = useLocation()
  const section = pathname.split('/')[1]
  const current = section ? getNavItem(section)?.label ?? '页面不存在' : '总览'

  return (
    <>
      {/* 背景挂在布局层而不是页面里：切路由时 MainLayout 不卸载，
          canvas 只初始化一次，所有页面共享同一片背景。 */}
      <SiteBackground theme={theme} />

      <a href="#main-content" className="skip-link" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>跳到正文</a>
      <div className="app-shell">
        <NavBar preference={preference} onThemeChange={chooseTheme} />
        <main className="app-main" id="main-content" tabIndex={-1}>
          <div className="page-coordinate">
            <span className="coordinate-brand" aria-hidden="true">N / PERSONAL ARCHIVE</span>
            <nav aria-label="当前位置"><Link to="/">工作台</Link><span aria-hidden="true">/</span><span>{current}</span></nav>
          </div>
          {/* 路由级按需加载的落点：NavBar 常驻，只替换内容区 */}
          <ContentBoundary resetKey={pathname}>
            <Suspense fallback={<div className="route-loading" role="status">LOADING…</div>}>
              <Outlet />
            </Suspense>
          </ContentBoundary>
        </main>
        <footer className="app-footer">
          <span>Nonight Hub</span>
          <span className="app-footer-dot">·</span>
          <span>记录 · 连接 · 探索</span>
        </footer>
      </div>
    </>
  )
}
