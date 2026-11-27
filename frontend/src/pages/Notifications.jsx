import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Clock, Heart, MessageSquareText, UserRound, X } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useNotifications } from '../context/NotificationContext'
import { api } from '../services/api'
import './Notifications.css'

function Notifications() {
  const { user } = useAuth()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  } = useNotifications()
  const navigate = useNavigate()
  const [accepting, setAccepting] = useState(new Set())

  const iconByType = {
    POST_LIKE: <Heart size={16} aria-hidden="true" />,
    POST_COMMENT: <MessageSquareText size={16} aria-hidden="true" />,
    FOLLOW_REQUEST: <UserRound size={16} aria-hidden="true" />,
    FOLLOW_ACCEPTED: <UserRound size={16} aria-hidden="true" />,
  }

  useEffect(() => {
    if (!user) return
    refresh()
  }, [user, refresh])

  function handleMarkAsRead(id) {
    markAsRead(id)
  }

  function handleMarkAllAsRead() {
    markAllAsRead()
  }

  function handleDelete(id) {
    removeNotification(id)
  }

  function handleAccept(notification) {
    const actorId = notification.actorId
    setAccepting((prev) => new Set([...prev, actorId]))
    api.post(`/api/students/${actorId}/follow/accept`)
      .then(() => {
        handleMarkAsRead(notification.id)
        return refresh()
      })
      .catch(() => {
        // Ignore individual accept failures; server owns the truth
      })
      .finally(() => {
        setAccepting((prev) => {
          const next = new Set(prev)
          next.delete(actorId)
          return next
        })
      })
  }

  function handleNotificationClick(notification) {
    handleMarkAsRead(notification.id)
    if (notification.linkTarget) {
      navigate(notification.linkTarget)
    }
  }

  function typeLabel(type) {
    switch (type) {
      case 'POST_LIKE':
        return 'Liked your post'
      case 'POST_COMMENT':
        return 'Commented on your post'
      case 'FOLLOW_REQUEST':
        return 'Started following you'
      case 'FOLLOW_ACCEPTED':
        return 'Accepted your follow request'
      default:
        return 'Notification'
    }
  }

  if (loading) {
    return (
      <main className="notifications-page">
        <div className="notifications-loading">Loading notifications…</div>
      </main>
    )
  }

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <Link className="notifications-back" to="/student/feed" aria-label="Back to feed">
          <ArrowLeft size={16} aria-hidden="true" />
          Home
        </Link>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notifications-mark-all"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <section className="notifications-empty">
          <div className="notifications-empty__icon">
            <Bell size={48} aria-hidden="true" />
          </div>
          <h2>No notifications yet</h2>
          <p>
            When someone likes or comments on your post, or starts following you,
            you&apos;ll see it here.
          </p>
        </section>
      ) : (
        <section className="notifications-list" aria-label="Notifications">
          {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-item ${notification.isRead ? 'notification-item--read' : 'notification-item--unread'}`}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleNotificationClick(notification)
                  }
                }}
              >
                <div className="notification-item__icon">
                  {iconByType[notification.type] || <Clock size={16} aria-hidden="true" />}
                </div>
                <div className="notification-item__content">
                  <div className="notification-item__header">
                    <span className="notification-item__actor">{notification.actorFullName}</span>
                    <span className="notification-item__type">{typeLabel(notification.type)}</span>
                  </div>
                  <p className="notification-item__message">{notification.message}</p>
                  <time className="notification-item__time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </time>
                </div>
                <div className="notification-item__actions">
                  {notification.type === 'FOLLOW_REQUEST' && !notification.isRead && !accepting.has(notification.actorId) && (
                    <button
                      type="button"
                      className="notification-item__accept-btn"
                      disabled={accepting.has(notification.actorId)}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleAccept(notification)
                      }}
                    >
                      {accepting.has(notification.actorId) ? 'Accepting…' : 'Accept'}
                    </button>
                  )}
                  {!notification.isRead && (
                    <button
                      type="button"
                      className="notification-item__read-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleMarkAsRead(notification.id)
                      }}
                      aria-label="Mark as read"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    type="button"
                    className="notification-item__delete-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDelete(notification.id)
                    }}
                    aria-label="Delete notification"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </div>
              </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default Notifications