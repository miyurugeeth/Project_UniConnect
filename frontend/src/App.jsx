import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/useAuth'
import Login from './pages/Login'
import ProfessionalRegistration from './pages/ProfessionalRegistration'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import RoleDashboard from './pages/RoleDashboard'
import StudentRegistration from './pages/StudentRegistration'
import StudentDashboard from './pages/StudentDashboard'

const dashboardPaths = {
  STUDENT: '/student/dashboard',
  PROFESSIONAL: '/professional/dashboard',
  ADMIN: '/admin/dashboard',
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth()
  return (
    <Navigate
      to={isAuthenticated ? dashboardPaths[user.role] || '/login' : '/login'}
      replace
    />
  )
}

function LoginRoute() {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={dashboardPaths[user.role] || '/login'} replace />
  }
  return <Login />
}

function RegistrationRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={dashboardPaths[user.role] || '/login'} replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/register"
          element={
            <RegistrationRoute>
              <StudentRegistration />
            </RegistrationRoute>
          }
        />
        <Route
          path="/register/professional"
          element={
            <RegistrationRoute>
              <ProfessionalRegistration />
            </RegistrationRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PROFESSIONAL']}>
              <ProfessionalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RoleDashboard role="ADMIN" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
