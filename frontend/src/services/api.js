import axios from 'axios'

export const AUTH_STORAGE_KEY = 'uniconnect.auth'

export function getStoredAuthentication() {
  const storedValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedValue) return null

  try {
    const authentication = JSON.parse(storedValue)
    if (
      typeof authentication?.accessToken === 'string' &&
      authentication.accessToken.length > 0 &&
      typeof authentication.user?.userId === 'string' &&
      typeof authentication.user?.fullName === 'string' &&
      typeof authentication.user?.email === 'string' &&
      ['STUDENT', 'PROFESSIONAL', 'ADMIN'].includes(authentication.user?.role)
    ) {
      return authentication
    }
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  return null
}

export function clearStoredAuthentication() {
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new Event('uniconnect:authentication-cleared'))
}

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? '' : 'http://localhost:8080'),
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getNotifications(page = 0, size = 20) {
  return api.get('/api/notifications', { params: { page, size } })
}

export function getUnreadCount() {
  return api.get('/api/notifications/unread-count')
}

export function markNotificationAsRead(notificationId) {
  return api.put(`/api/notifications/${notificationId}/read`)
}

export function markAllNotificationsAsRead() {
  return api.put('/api/notifications/read-all')
}

export function deleteNotification(notificationId) {
  return api.delete(`/api/notifications/${notificationId}`)
}

export function acceptFollowRequest(studentId) {
  return api.post(`/api/students/${studentId}/follow/accept`)
}

api.interceptors.request.use((config) => {
  const isLoginRequest = config.url?.includes('/api/auth/login')
  const authentication = isLoginRequest ? null : getStoredAuthentication()

  if (authentication?.accessToken) {
    config.headers.Authorization = `Bearer ${authentication.accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuthentication()
    }

    return Promise.reject(error)
  },
)
