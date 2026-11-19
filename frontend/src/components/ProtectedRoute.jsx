import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const dashboardPaths = {
  STUDENT: '/student/feed',
  PROFESSIONAL: '/student/feed',
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

  return children || <Outlet />
}

export default ProtectedRoute
