import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  BellOff,
  Clock,
  Heart,
  MessageSquareText,
  UserRound,
  X,
} from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { api } from '../services/api'
import './NotificationBell.css'

const iconByType = {
  POST_LIKE: <Heart size={14} aria-hidden="true" />,
  POST_COMMENT: <MessageSquareText size={14} aria-hidden="true" />,
  FOLLOW_REQUEST: <UserRound size={14} aria-hidden="true" />,
  FOLLOW_ACCEPTED: <UserRound size={14} aria-hidden="true" />,
}

function typeLabel(type) {
  switch (type) {
    case 'POST_LIKE':
      return 'Liked your post'
    case 'POST_COMMENT':
      return 'Commented on your post'
    case 'FOLLOW_REQUEST':
      return 'Sent a follow request'
    case 'FOLLOW_ACCEPTED':
      return 'Accepted your follow request'
    default:
      return 'Notification'
  }
}

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    refresh,
  } = useNotifications()
  const [open, setOpen] = useState(false)
  const [accepting, setAccepting] = useState(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (open && !event.target.closest('.notification-bell-wrapper')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function close() {
    setOpen(false)
  }

  function handleItemClick(notification) {
    markAsRead(notification.id)
    if (notification.linkTarget) {
      navigate(notification.linkTarget)
    }
    close()
  }

  function handleAccept(notification) {
    const actorId = notification.actorId
    setAccepting((prev) => new Set([...prev, actorId]))
    api.post(`/api/students/${actorId}/follow/accept`)
      .then(() => {
        markAsRead(notification.id)
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

  return (
    <>
      <button
        type="button"
        className="notification-bell"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? 'View notifications' : 'Notifications'}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'No new notifications'}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((prev) => !prev)
        }}
      >
        <span className="notification-bell__icon">
          {unreadCount > 0 ? <Bell size={18} aria-hidden="true" /> : <BellOff size={18} aria-hidden="true" />}
        </span>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown" onClick={(event) => event.stopPropagation()}>
          <div className="notification-dropdown__header">
            <h3>Notifications</h3>
            <button
              type="button"
              className="notification-dropdown__mark-all"
              disabled={unreadCount === 0}
              onClick={(event) => {
                event.stopPropagation()
                markAllAsRead()
                close()
              }}
            >
              Mark all as read
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="notification-dropdown__empty">
              <p>No new notifications.</p>
            </div>
          ) : (
            <ul className="notification-dropdown__list" role="menu">
              {notifications.slice(0, 8).map((notification) => (
                <li
                  key={notification.id}
                  className={`notification-dropdown__item ${notification.isRead ? 'notification-dropdown__item--read' : 'notification-dropdown__item--unread'}`}
                  role="menuitem"
                  onClick={() => handleItemClick(notification)}
                >
                  <div className="notification-dropdown__icon">
                    {iconByType[notification.type] || <Clock size={14} aria-hidden="true" />}
                  </div>
                  <div className="notification-dropdown__body">
                    <div className="notification-dropdown__header-row">
                      <span className="notification-dropdown__actor">
                        {notification.actorFullName}
                      </span>
                      <span className="notification-dropdown__type">
                        {typeLabel(notification.type)}
                      </span>
                    </div>
                    <p className="notification-dropdown__message">
                      {notification.message}
                    </p>
                    <time className="notification-dropdown__time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <div className="notification-dropdown__actions">
                    {notification.type === 'FOLLOW_REQUEST' && !notification.isRead && !accepting.has(notification.actorId) && (
                      <button
                        type="button"
                        className="notification-dropdown__accept-btn"
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
                        className="notification-dropdown__read-btn"
                        onClick={(event) => {
                          event.stopPropagation()
                          markAsRead(notification.id)
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      type="button"
                      className="notification-dropdown__delete-btn"
                      aria-label="Delete notification"
                      onClick={(event) => {
                        event.stopPropagation()
                        removeNotification(notification.id)
                      }}
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link
            to="/notifications"
            className="notification-dropdown__view-all"
            onClick={(event) => {
              event.stopPropagation()
              close()
            }}
          >
            <ArrowRight size={14} aria-hidden="true" />
            View all notifications
          </Link>
        </div>
      )}
    </>
  )
}

export default NotificationDropdown
