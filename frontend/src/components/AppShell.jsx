import { useState } from 'react'
import {
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessageSquareText,
  Newspaper,
  PencilLine,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ThemeToggle from './ThemeToggle'
import './AppShell.css'

function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const profilePath =
    user?.role === 'PROFESSIONAL'
      ? '/professional/dashboard'
      : user?.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/student/dashboard'

  const navigation =
    user?.role === 'ADMIN'
      ? [
          { label: 'Overview', to: '/admin/dashboard', icon: Home },
          { label: 'Messages', to: '/messages', icon: MessageSquareText },
          { label: 'Notifications', to: '/notifications', icon: Newspaper },
        ]
      : [
          { label: 'Home', to: '/student/feed', icon: Home },
          { label: 'Create Post', to: '/student/feed?compose=true', icon: PencilLine },
          { label: 'My Posts', to: '/student/feed?mine=true', icon: Newspaper },
          { label: 'Profile', to: profilePath, icon: UserRound },
          { label: 'Connections', to: '/student/feed?view=connections', icon: UsersRound },
          { label: 'Messages', to: '/messages', icon: MessageSquareText },
          { label: 'Notifications', to: '/notifications', icon: Newspaper },
        ]

  function isCurrentItem(item) {
    if (item.label === 'Home') {
      return location.pathname === '/student/feed' && !location.search && !location.hash
    }
    if (item.to.includes('?mine=true')) {
      return location.pathname === '/student/feed' && location.search.includes('mine=true')
    }
    if (item.to.includes('?compose=true')) {
      return location.pathname === '/student/feed' && location.search.includes('compose=true')
    }
    if (item.to.includes('?view=connections')) {
      return location.pathname === '/student/feed' && location.search.includes('view=connections')
    }
    return location.pathname === item.to
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <div className="app-shell__brand-wrap">
          <button
            type="button"
            className="app-shell__menu-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isSidebarOpen}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link
            className="app-shell__brand"
            to="/"
            aria-label="UniConnect home"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="app-shell__brand-mark">
              <GraduationCap size={21} aria-hidden="true" />
            </span>
            <span>Uni<span>Connect</span></span>
          </Link>
        </div>
        <div className="app-shell__actions">
          <ThemeToggle />
          <button type="button" className="app-shell__logout" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </header>

      {isSidebarOpen && (
        <button
          type="button"
          className="app-shell__backdrop"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`app-shell__sidebar${isSidebarOpen ? ' app-shell__sidebar--open' : ''}`}>
        <div className="app-shell__sidebar-heading">
          <span className="app-shell__sidebar-kicker">YOUR CAMPUS NETWORK</span>
          <span className="app-shell__sidebar-role">
            {user?.role === 'PROFESSIONAL' ? (
              <BriefcaseBusiness size={15} aria-hidden="true" />
            ) : user?.role === 'STUDENT' ? (
              <BookOpen size={15} aria-hidden="true" />
            ) : (
              <UsersRound size={15} aria-hidden="true" />
            )}
            {user?.role?.toLowerCase() || 'member'} space
          </span>
        </div>

        <nav className="app-shell__navigation" aria-label="Main navigation">
          {navigation.map(({ label, to, icon: Icon }) => (
            <Link
              className={`app-shell__nav-link${isCurrentItem({ label, to }) ? ' app-shell__nav-link--active' : ''}`}
              to={to}
              key={label}
              onClick={() => setSidebarOpen(false)}
              aria-current={isCurrentItem({ label, to }) ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="app-shell__sidebar-account">
          <span className="app-shell__account-avatar" aria-hidden="true">
            {user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'U'}
          </span>
          <span className="app-shell__account-details">
            <strong>{user?.fullName || 'UniConnect member'}</strong>
            <span>{user?.email || ''}</span>
          </span>
        </div>
      </aside>

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
