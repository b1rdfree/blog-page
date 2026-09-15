import { Outlet } from 'react-router-dom'
import NavBar from '../components/NavBar'

export default function MainLayout() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>Nonight Hub</span>
        <span className="app-footer-dot">·</span>
        <span>Vite + React + Markdown</span>
      </footer>
    </div>
  )
}
