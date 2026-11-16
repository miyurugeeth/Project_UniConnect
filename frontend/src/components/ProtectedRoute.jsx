import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const dashboardPaths = {
  STUDENT: '/student/dashboard',
  PROFESSIONAL: '/professional/dashboard',
  ADMIN: '/admin/dashboard',
}

function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPaths[user.role] || '/login'} replace />
  }

  return children
}

export default ProtectedRoute
