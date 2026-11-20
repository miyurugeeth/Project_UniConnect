import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const [listResponse, countResponse] = await Promise.all([
        api.get('/api/notifications'),
        api.get('/api/notifications/unread-count'),
      ])
      setNotifications(listResponse.data.content)
      setUnreadCount(countResponse.data)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await api.put(`/api/notifications/${notificationId}/read`)
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, isRead: true }
              : n,
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // Ignore individual mark-as-read failures
      }
    },
    [],
  )

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/api/notifications/read-all')
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true })),
      )
      setUnreadCount(0)
    } catch {
      // Ignore failures
    }
  }, [])

const removeNotification = useCallback(
    async (notificationId) => {
      try {
        await api.delete(`/api/notifications/${notificationId}`)
        setNotifications((prev) => {
          const removed = prev.find((n) => n.id === notificationId)
          setUnreadCount((count) =>
            removed && !removed.isRead ? Math.max(0, count - 1) : count,
          )
          return prev.filter((n) => n.id !== notificationId)
        })
      } catch {
        // Ignore individual delete failures
      }
    },
    [],
  )

  const refresh = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
