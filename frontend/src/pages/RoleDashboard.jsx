import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import './Dashboard.css'

function RoleDashboard({ role }) {
  const { user } = useAuth()
  const isProfessional = role === 'PROFESSIONAL'

  return (
    <main className="dashboard-page">
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
