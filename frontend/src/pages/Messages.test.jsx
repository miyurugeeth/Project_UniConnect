/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../services/api'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import Messages from './Messages'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ user: { userId: 'student-1', role: 'STUDENT' } }),
}))

const contact = {
  id: 'professional-1',
  fullName: 'Taylor Professional',
  profileImageUrl: null,
  role: 'PROFESSIONAL',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('searches for a user, opens the chat box, and sends a direct message', async () => {
  api.get.mockImplementation((url) => {
    if (url === '/api/messages/conversations') {
      return Promise.resolve({ data: [] })
    }
    if (url === '/api/messages/users') {
      return Promise.resolve({ data: { content: [contact] } })
    }
    if (url.endsWith('/conversations/professional-1')) {
      return Promise.resolve({ data: { content: [] } })
    }
    return Promise.reject(new Error(`Unexpected request: ${url}`))
  })
  api.post.mockResolvedValue({
    data: {
      id: 'message-1',
      senderId: 'student-1',
      recipientId: contact.id,
      content: 'Hello Taylor!',
      sentAt: '2026-01-01T10:00:00Z',
    },
  })

  render(
    <MemoryRouter initialEntries={['/messages']}>
      <ThemeProvider>
        <Messages />
      </ThemeProvider>
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search users' }), {
    target: { value: 'Taylor' },
  })
  fireEvent.click(await screen.findByRole('button', { name: /Taylor Professional/ }))

  expect(await screen.findByRole('heading', { name: 'Taylor Professional' })).toBeTruthy()
  fireEvent.change(screen.getByRole('textbox', { name: 'Write a message' }), {
    target: { value: '  Hello Taylor!  ' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

  expect(await screen.findByText('Hello Taylor!')).toBeTruthy()
  expect(api.post).toHaveBeenCalledWith(
    '/api/messages/conversations/professional-1',
    { content: 'Hello Taylor!' },
  )
})
