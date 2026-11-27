/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../services/api'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import { NotificationProvider } from '../context/NotificationContext.jsx'
import NotificationDropdown from './NotificationDropdown'

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
    isRead: false,
    createdAt: '2026-01-02T10:00:00Z',
    actorId: 'actor-2',
    actorFullName: 'Actor Two',
    actorProfileImageUrl: null,
  },
]

function renderDropdown() {
  vi.mocked(api.get).mockImplementation((url) => {
    if (String(url).includes('unread-count')) {
      return Promise.resolve({ data: 2 })
    }
    return Promise.resolve({
      data: { content: notifications, number: 0, totalPages: 1 },
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
          <NotificationDropdown />
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

describe('NotificationDropdown', () => {
  it('renders the bell with an unread badge after loading', async () => {
    renderDropdown()
    await waitFor(() => {
      expect(screen.getByText('2'))
    })
    const bell = screen.getByRole('button', { name: /View notifications/i })
    expect(bell)
  })

  it('opens the dropdown and lists notifications when the bell is clicked', async () => {
    renderDropdown()
    const bell = screen.getByRole('button', { name: /Notifications/i })
    await waitFor(() => {
      expect(screen.getByText('2'))
    })
    fireEvent.click(bell)
    await waitFor(() => {
      expect(screen.getByText('Notifications'))
    })
    expect(screen.getByText('Actor started following you.'))
    expect(screen.getByText('Liked your post.'))
  })

  it('calls acceptFollowRequest when accepting a follow request', async () => {
    renderDropdown()
    const bell = screen.getByRole('button', { name: /Notifications/i })
    await waitFor(() => {
      expect(screen.getByText('2'))
    })
    fireEvent.click(bell)
    await waitFor(() => {
      expect(screen.getByText('Sent a follow request'))
    })
    const acceptBtn = screen.getByRole('button', { name: /Accept/i })
    fireEvent.click(acceptBtn)
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/students/actor-1/follow/accept')
    })
  })

  it('calls deleteNotification when deleting a notification', async () => {
    renderDropdown()
    const bell = screen.getByRole('button', { name: /Notifications/i })
    await waitFor(() => {
      expect(screen.getByText('2'))
    })
    fireEvent.click(bell)
    await waitFor(() => {
      expect(screen.getByText('Liked your post.'))
    })
    const deleteBtn = screen.getAllByRole('button', {
      name: /Delete notification/i,
    })[0]
    fireEvent.click(deleteBtn)
    expect(api.delete).toHaveBeenCalledWith('/api/notifications/notif-1')
  })

  it('navigates to /notifications via the View all link', () => {
    renderDropdown()
    const bell = screen.getByRole('button', { name: /Notifications/i })
    fireEvent.click(bell)
    const link = screen.getByRole('link', { name: /View all notifications/i })
    expect(link.getAttribute('href')).toBe('/notifications')
  })
})
