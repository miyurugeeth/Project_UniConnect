import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  Bell,
  Clipboard,
  Home,
  LogOut,
  MessageCircle,
  Users,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import '../pages/SocialNetworking.css'

const NAV_ITEMS = [
  { to: '/student/feed', label: 'Student Feed', icon: Home },
  { to: '/student/my-posts', label: 'My Posts', icon: Clipboard },
  { to: '/student/connections', label: 'Connections', icon: Users },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/student/student-space', label: 'Student Space', icon: Users },
]

export default function StudentSidebar({ onLogout }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    if (onLogout) onLogout()
  }

  const initials = user?.fullName
    ? user.fullName.split(/\s+/).map((n) => n[0]).join('')
    : 'U'

  return (
    <aside className="sidebar-sidebar social-sidebar--left" aria-label="Main navigation">
      <div className="sidebar-profile">
        {user?.profileImageUrl ? (
          <img
            className="sidebar-profile__avatar"
            src={user.profileImageUrl}
            alt={user.fullName}
            loading="lazy"
          />
        ) : (
          <div className="sidebar-profile__avatar sidebar-avatar--fallback">{initials}</div>
        )}
        <div className="sidebar-profile-info">
          <div className="sidebar-profile__name">{user?.fullName}</div>
          <div className="sidebar-profile__subtitle">
            {user?.universityName || 'University Student'}
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
          return (
            <Link
              key={item.to}
              className={`sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`}
              to={item.to}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} aria-hidden="true" className="sidebar-nav-item__indicator" />}
            </Link>
          )
        })}
        <div className="sidebar-nav-divider" />
        <Link
          to="/student/student-space"
          className="sidebar-nav-item sidebar-nav-item--premium"
        >
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Student Space</span>
        </Link>
      </nav>
      <div className="sidebar-logout">
        <button
          className="sidebar-logout-btn"
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}
