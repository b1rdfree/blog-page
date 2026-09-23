import { Link, NavLink } from 'react-router-dom'
import { navItems, HOME_KEY } from '../config/nav'

import ThemeToggle from './ThemeToggle'
import type { ThemePreference } from '../lib/useTheme'

export default function NavBar({ preference, onThemeChange }: { preference: ThemePreference; onThemeChange: (value: ThemePreference) => void }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" aria-label="Nonight Hub 首页">
          <span className="navbar-logo" aria-hidden="true" />
          <span className="navbar-title">Nonight Hub</span>
        </Link>

        <div className="navbar-controls">
          <nav className="navbar-links" aria-label="主导航">
            {navItems.map((item, index) => (
              <NavLink
                key={item.key}
                to={item.key === HOME_KEY ? '/' : `/${item.key}`}
                end={item.key === HOME_KEY}
                className={({ isActive }) => (isActive ? 'navbar-link is-active' : 'navbar-link')}
              >
                <span className="nav-index" aria-hidden="true">{String(index).padStart(2, '0')}</span>
                {item.label}
                {item.badge ? <span className="navbar-badge">{item.badge}</span> : null}
              </NavLink>
            ))}
          </nav>
          <ThemeToggle preference={preference} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  )
}
