import { GraduationCap, LogOut, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './Dashboard.css'

function RoleDashboard({ role }) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const isProfessional = role === 'PROFESSIONAL'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="/" aria-label="UniConnect home">
          <span className="dashboard-brand__icon">
            <GraduationCap size={22} aria-hidden="true" />
          </span>
          <span>
            Uni<span>Connect</span>
          </span>
        </a>
        <div className="dashboard-header__actions">
          <span className="dashboard-role">
            {isProfessional ? 'Professional space' : 'Admin space'}
          </span>
          <button className="dashboard-logout" type="button" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </header>
      <section className="role-placeholder">
        <span className="role-placeholder__icon">
          <Sparkles size={24} aria-hidden="true" />
        </span>
        <p className="dashboard-eyebrow">
          {isProfessional ? 'PROFESSIONAL SPACE' : 'ADMIN SPACE'}
        </p>
        <h1>Welcome, {user?.fullName || 'to UniConnect'}.</h1>
        <p>
          {isProfessional
            ? 'Your professional dashboard is coming soon. Your account is signed in, and you will not see student profile information here.'
            : 'Your admin dashboard is coming soon.'}
        </p>
      </section>
    </main>
  )
}

export default RoleDashboard
