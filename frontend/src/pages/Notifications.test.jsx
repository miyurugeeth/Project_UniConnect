/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../services/api'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import { NotificationProvider } from '../context/NotificationContext.jsx'
import Notifications from './Notifications'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ user: { userId: 'student-1', fullName: 'Current Student' } }),
}))

const notifications = [
  {
    id: 'notif-1',
    type: 'FOLLOW_REQUEST',
    message: 'Actor started following you.',
    linkTarget: '/student/profiles/actor-1',
    isRead: false,
    createdAt: '2026-01-01T10:00:00Z',
    actorId: 'actor-1',
    actorFullName: 'Actor One',
    actorProfileImageUrl: null,
  },
  {
    id: 'notif-2',
    type: 'POST_LIKE',
    message: 'Liked your post.',
    linkTarget: '/student/feed',
    isRead: true,
    createdAt: '2026-01-02T10:00:00Z',
    actorId: 'actor-2',
    actorFullName: 'Actor Two',
    actorProfileImageUrl: null,
  },
]

function renderPage(withNotifications = notifications) {
  vi.mocked(api.get).mockImplementation((url) => {
    if (String(url).includes('unread-count')) {
      return Promise.resolve({ data: withNotifications.length })
    }
    return Promise.resolve({
      data: { content: withNotifications, number: 0, totalPages: 1 },
    })
  })
  vi.mocked(api.put).mockImplementation((url) =>
    Promise.resolve({
      data: { id: String(url).match(/notifications\/([^/]+)/)?.[1] || 'notif-1' },
    }),
  )
  vi.mocked(api.delete).mockResolvedValue({})
  vi.mocked(api.post).mockResolvedValue({})
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <NotificationProvider>
          <Notifications />
        </NotificationProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('Notifications page', () => {
  it('shows empty state when there are no notifications', async () => {
    renderPage([])
    await waitFor(() => {
      expect(screen.getByText('No notifications yet'))
    })
  })

  it('renders the notifications list with unread indicator', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Actor started following you.'))
      expect(screen.getByText('Liked your post.'))
    })
    expect(screen.getByText('Started following you'))
    expect(screen.getByText('Liked your post'))
  })

  it('marks a single notification as read', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Actor started following you.'))
    })
    vi.mocked(api.put).mockResolvedValue({
      data: { ...notifications[0], isRead: true },
    })
    const readBtn = screen.getByRole('button', { name: 'Mark as read' })
    fireEvent.click(readBtn)
    expect(api.put).toHaveBeenCalledWith('/api/notifications/notif-1/read')
  })

  it('marks all notifications as read', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Mark all as read'))
    })
    fireEvent.click(screen.getByText('Mark all as read'))
    expect(api.put).toHaveBeenCalledWith('/api/notifications/read-all')
  })

  it('deletes a notification', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Liked your post.'))
    })
    const deleteBtns = screen.getAllByRole('button', { name: /Delete notification/i })
    fireEvent.click(deleteBtns[0])
    expect(api.delete).toHaveBeenCalledWith('/api/notifications/notif-1')
  })

  it('accepts a follow request notification', async () => {
    renderPage()
    await waitFor(() => {
    expect(screen.getByText('Started following you'))
    })
    const acceptBtn = screen.getByRole('button', { name: 'Accept' })
    fireEvent.click(acceptBtn)
    expect(api.post).toHaveBeenCalledWith('/api/students/actor-1/follow/accept')
  })
})
