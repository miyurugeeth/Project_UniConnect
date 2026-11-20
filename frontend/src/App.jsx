import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/useAuth'
import Login from './pages/Login'
import ProfessionalRegistration from './pages/ProfessionalRegistration'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import RoleDashboard from './pages/RoleDashboard'
import StudentRegistration from './pages/StudentRegistration'
import StudentDashboard from './pages/StudentDashboard'
import StudentSocialFeed from './pages/StudentSocialFeed'
import StudentProfile from './pages/StudentProfile'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'

import Layout from './components/Layout'

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
            <Layout>
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/student/feed"
          element={
            <Layout>
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentSocialFeed />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/student/profiles/:studentId"
          element={
            <Layout>
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentProfile />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/messages"
          element={
            <Layout>
              <ProtectedRoute allowedRoles={['STUDENT', 'PROFESSIONAL', 'ADMIN']}>
                <Messages />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/notifications"
          element={
            <Layout>
              <ProtectedRoute allowedRoles={['STUDENT', 'PROFESSIONAL', 'ADMIN']}>
                <Notifications />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/professional/dashboard"
          element={
            <Layout>
              <ProtectedRoute allowedRoles={['PROFESSIONAL']}>
                <ProfessionalDashboard />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <Layout>
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RoleDashboard role="ADMIN" />
              </ProtectedRoute>
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
