import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import StudentSidebar from './StudentSidebar'

function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isStudent = user?.role === 'STUDENT'

  const handleLogout = () => {
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      {isStudent && <StudentSidebar onLogout={handleLogout} />}
      <div className="layout__content">
        {children}
      </div>
    </div>
  )
}

export default Layout
