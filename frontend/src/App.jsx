import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
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

const homePaths = {
  STUDENT: '/student/feed',
  PROFESSIONAL: '/student/feed',
  ADMIN: '/admin/dashboard',
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth()
  return (
    <Navigate
      to={isAuthenticated ? homePaths[user.role] || '/login' : '/login'}
      replace
    />
  )
}

function LoginRoute() {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={homePaths[user.role] || '/login'} replace />
  }
  return <Login />
}

function RegistrationRoute({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    return <Navigate to={homePaths[user.role] || '/login'} replace />
  }
  return children
}

function StudentFeedRoute() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const feedView =
    searchParams.get('mine') === 'true'
      ? 'mine'
      : searchParams.get('view') || 'home'
  return <StudentSocialFeed key={feedView} />
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
        <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'PROFESSIONAL', 'ADMIN']} />}>
          <Route element={<AppShell />}>
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/feed"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'PROFESSIONAL']}>
                  <StudentFeedRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profiles/:studentId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'PROFESSIONAL', 'ADMIN']}>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'PROFESSIONAL', 'ADMIN']}>
                  <Notifications />
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
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
