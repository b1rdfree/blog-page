import { Link, NavLink } from 'react-router-dom'
import { navItems, HOME_KEY } from '../config/nav'

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo" aria-hidden="true" />
          <span className="navbar-title">Nonight Hub</span>
        </Link>

        <nav className="navbar-links" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.key === HOME_KEY ? '/' : `/${item.key}`}
              end={item.key === HOME_KEY}
              className={({ isActive }) => (isActive ? 'navbar-link is-active' : 'navbar-link')}
            >
              {item.label}
              {item.badge ? <span className="navbar-badge">{item.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
