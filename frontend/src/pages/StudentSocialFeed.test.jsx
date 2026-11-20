/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../services/api'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import { NotificationProvider } from '../context/NotificationContext.jsx'
import StudentSocialFeed from './StudentSocialFeed'

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

const firstPage = {
  content: [
    {
      id: 'post-1',
      content: 'My first update',
      imageUrl: null,
      attachments: [],
      likeCount: 2,
      likedByCurrentUser: false,
      commentCount: 1,
      category: {
        code: 'GENERAL_UNIVERSITY_LIFE',
        displayName: 'General University Life',
      },
      createdAt: '2026-01-01T10:00:00Z',
      author: {
        id: 'student-1',
        fullName: 'Current Student',
        universityName: 'Example University',
        faculty: 'Science',
      },
    },
  ],
  number: 0,
  totalPages: 2,
}

const categories = [
  { code: 'ICT_COMPUTING', displayName: 'ICT and Computing' },
  { code: 'GENERAL_UNIVERSITY_LIFE', displayName: 'General University Life' },
]
let scrollIntoViewDescriptor

afterEach(() => {
  cleanup()
  if (scrollIntoViewDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoViewDescriptor)
  } else {
    delete HTMLElement.prototype.scrollIntoView
  }
  scrollIntoViewDescriptor = null
  vi.restoreAllMocks()
})

describe('StudentSocialFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView',
    )
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    api.get.mockImplementation((url) => {
      if (url === '/api/students/categories') {
        return Promise.resolve({ data: categories })
      }
      if (url === '/api/students/feed') {
        return Promise.resolve({ data: firstPage })
      }
      if (url.endsWith('/comments')) {
        return Promise.resolve({
          data: {
            content: [
              {
                id: 'comment-1',
                content: 'A helpful comment',
                createdAt: '2026-01-01T10:00:00Z',
                author: {
                  id: 'student-2',
                  fullName: 'Ada Student',
                },
              },
            ],
            number: 0,
            totalPages: 1,
          },
        })
      }
      if (url === '/api/students/search') {
        return Promise.resolve({
          data: {
            content: [
              {
                id: 'student-2',
                fullName: 'Ada Student',
                universityName: 'Example University',
                faculty: 'Engineering',
              },
            ],
          },
        })
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    api.post.mockImplementation((url) => {
      if (url.endsWith('/likes')) {
        return Promise.resolve({ data: { likeCount: 3, likedByCurrentUser: true } })
      }
      return Promise.resolve({ data: {} })
    })
    api.put.mockResolvedValue({ data: {} })
    api.delete.mockResolvedValue({ data: {} })
  })

  afterEach(() => {
    delete URL.createObjectURL
    delete URL.revokeObjectURL
  })

  it('shows the latest feed content and only offers owner actions', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('My first update')).toBeTruthy()
    expect(
      within(screen.getByRole('article')).getByText('General University Life'),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy()
  })

  it('loads category choices and offers an all-categories filter', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(
      await within(screen.getByLabelText('Post category')).findByRole('option', {
        name: 'ICT and Computing',
      }),
    ).toBeTruthy()
    expect(
      within(screen.getByLabelText('Filter by category')).getByRole('option', {
        name: 'All Categories',
      }),
    ).toBeTruthy()
    expect(api.get).toHaveBeenCalledWith(
      '/api/students/categories',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('creates a multipart post without sending any client-supplied owner ID', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    fireEvent.change(await screen.findByLabelText('Post text'), {
      target: { value: 'A new update' },
    })
    const postCategory = screen.getByLabelText('Post category')
    await within(postCategory).findByRole('option', { name: 'ICT and Computing' })
    fireEvent.change(postCategory, {
      target: { value: 'ICT_COMPUTING' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/students/posts',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      )
    })
    const request = JSON.parse(await api.post.mock.calls[0][1].get('post').text())
    expect(request).not.toHaveProperty('userId')
    expect(request).not.toHaveProperty('authorId')
    expect(request).toEqual({
      content: 'A new update',
      imageUrl: null,
      categoryCode: 'ICT_COMPUTING',
    })
  })

  it('edits an owned post through its post-specific endpoint', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Post text'), {
      target: { value: 'Updated update' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/api/students/posts/post-1',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      )
    })
    const request = JSON.parse(await api.put.mock.calls[0][1].get('post').text())
    expect(request.content).toBe('Updated update')
    expect(request.categoryCode).toBe('GENERAL_UNIVERSITY_LIFE')
  })

  it('smoothly scrolls to the editor for the clicked post and focuses its text field', async () => {
    const secondPost = {
      ...firstPage.content[0],
      id: 'post-2',
      content: 'My second update',
      category: { code: 'ICT_COMPUTING', displayName: 'ICT and Computing' },
    }
    api.get.mockImplementation((url) => {
      if (url === '/api/students/categories') {
        return Promise.resolve({ data: categories })
      }
      if (url === '/api/students/feed') {
        return Promise.resolve({ data: { ...firstPage, content: [...firstPage.content, secondPost] } })
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })
    const scrollIntoView = vi.fn(function () {
      this.scrolledIntoView = true
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    const secondPostArticle = await screen.findByText('My second update').then((text) =>
      text.closest('article'),
    )
    fireEvent.click(within(secondPostArticle).getByRole('button', { name: 'Edit' }))

    const editorHeading = screen.getByRole('heading', { name: 'Edit your post' })
    const editor = editorHeading.closest('section')
    const textField = screen.getByLabelText('Post text')
    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(scrollIntoView.mock.contexts[0]).toBe(editor)
      expect(document.activeElement).toBe(textField)
    })
    expect(textField.value).toBe('My second update')
    expect(screen.getByLabelText('Post category').value).toBe('ICT_COMPUTING')
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('sends the post-specific DELETE request when Delete is clicked', async () => {
    api.delete.mockResolvedValue({ status: 204 })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    expect(deleteButton.hasAttribute('disabled')).toBe(false)
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledTimes(1)
      expect(api.delete).toHaveBeenCalledWith('/api/students/posts/post-1')
    })
  })

  it('closes the editor after deleting the post being edited', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('heading', { name: 'Edit your post' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('heading', { name: 'Create a post' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cancel edit' })).toBeNull()
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/students/posts/post-1')
    })
  })

  it('moves to the previous feed page after deleting its only post', async () => {
    const lastPost = {
      ...firstPage.content[0],
      id: 'post-2',
      content: 'Last page update',
    }
    api.get.mockImplementation((url, config) => {
      if (url === '/api/students/categories') {
        return Promise.resolve({ data: categories })
      }
      if (url === '/api/students/feed') {
        return Promise.resolve({
          data:
            config.params.page === 1
              ? { ...firstPage, content: [lastPost], number: 1 }
              : firstPage,
        })
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await screen.findByText('Last page update')

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('My first update')).toBeTruthy()
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/students/posts/post-2')
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/students/feed',
        expect.objectContaining({ params: { page: 0, size: 10 } }),
      )
    })
  })

  it('shows safe feedback without server details when post deletion fails', async () => {
    api.delete.mockRejectedValue({
      message: 'sensitive server detail',
      code: 'ERR_BAD_REQUEST',
      response: { status: 403 },
    })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('We could not delete your post. Please try again.')).toBeTruthy()
    expect(screen.queryByText('sensitive server detail')).toBeNull()
  })

  it('shows safe feedback when the DELETE request has no HTTP response', async () => {
    api.delete.mockRejectedValue({
      message: 'sensitive network detail',
      code: 'ERR_NETWORK',
    })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('We could not delete your post. Please try again.')).toBeTruthy()
    expect(screen.queryByText('sensitive network detail')).toBeNull()
  })

  it('does not show edit or delete controls for another student’s post', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/students/categories') {
        return Promise.resolve({ data: categories })
      }
      return Promise.resolve({
        data: {
          ...firstPage,
          content: [
            {
              ...firstPage.content[0],
              author: { ...firstPage.content[0].author, id: 'student-2' },
            },
          ],
        },
      })
    })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('My first update')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })

  it('submits student search and links results to student profiles', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Search students' }), {
      target: { value: 'Ada' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    const result = await screen.findByRole('link', { name: /Ada Student/ })
    expect(result.getAttribute('href')).toBe('/student/profiles/student-2')
    expect(api.get).toHaveBeenCalledWith(
      '/api/students/search',
      expect.objectContaining({ params: { q: 'Ada', page: 0, size: 10 } }),
    )
  })

  it('loads the next feed page on demand', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/students/feed',
        expect.objectContaining({ params: { page: 1, size: 10 } }),
      )
    })
  })

  it('filters the feed by category while preserving the paginated endpoint', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await screen.findByText('My first update')
    const categoryFilter = screen.getByLabelText('Filter by category')
    await within(categoryFilter).findByRole('option', { name: 'ICT and Computing' })
    fireEvent.change(categoryFilter, {
      target: { value: 'ICT_COMPUTING' },
    })

    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/api/students/feed',
        expect.objectContaining({
          params: { page: 0, size: 10, category: 'ICT_COMPUTING' },
        }),
      )
    })
  })

  it('previews and removes a selected photo before publishing', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    fireEvent.change(await screen.findByLabelText('Photos or video'), {
      target: { files: [file] },
    })

    expect(await screen.findByAltText('Selected preview')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected attachment' }))
    expect(screen.queryByAltText('Selected preview')).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('uploads selected attachments as multipart file parts', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    fireEvent.change(await screen.findByLabelText('Post text'), {
      target: { value: 'A photo update' },
    })
    const categorySelect = screen.getByLabelText('Post category')
    await within(categorySelect).findByRole('option', { name: 'ICT and Computing' })
    fireEvent.change(categorySelect, {
      target: { value: 'ICT_COMPUTING' },
    })
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Photos or video'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/students/posts',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      )
    })
    expect(api.post.mock.calls[0][1].getAll('attachments')).toHaveLength(1)
    expect(api.post.mock.calls[0][1].getAll('attachments')[0].name).toBe('photo.png')
  })

  it('renders legacy posts without category data without failing', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/api/students/categories') return Promise.resolve({ data: categories })
      if (url === '/api/students/feed') {
        return Promise.resolve({
          data: { ...firstPage, content: [{ ...firstPage.content[0], category: null }] },
        })
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('My first update')).toBeTruthy()
    expect(screen.getByRole('article')).toBeTruthy()
  })

  it('updates likes without reloading the feed', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Like · 2' }))

    expect(await screen.findByRole('button', { name: 'Unlike · 3' })).toBeTruthy()
    expect(api.post).toHaveBeenCalledWith('/api/students/posts/post-1/likes')
    expect(api.get).toHaveBeenCalledTimes(4)
  })

  it('loads comments and supports editing and deleting the current student’s comments', async () => {
    api.get.mockImplementation((url) => {
      if (url.endsWith('/comments')) {
        return Promise.resolve({
          data: {
            content: [
              {
                id: 'comment-1',
                content: 'Current student comment',
                createdAt: '2026-01-01T10:00:00Z',
                author: { id: 'student-1', fullName: 'Current Student' },
              },
            ],
            number: 0,
            totalPages: 1,
          },
        })
      }
      if (url === '/api/students/categories') return Promise.resolve({ data: categories })
      if (url === '/api/students/feed') return Promise.resolve({ data: firstPage })
      return Promise.reject(new Error(`Unexpected request: ${url}`))
    })

    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationProvider>
          <StudentSocialFeed />
          </NotificationProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /Comments · 1/ }))
    expect(await screen.findByText('Current student comment')).toBeTruthy()
    let comment = screen.getByText('Current student comment').closest('.social-comment')
    fireEvent.click(within(comment).getByRole('button', { name: 'Edit' }))
    fireEvent.change(within(comment).getByLabelText('Edit comment'), {
      target: { value: 'Edited comment' },
    })
    fireEvent.click(within(comment).getByRole('button', { name: 'Save comment' }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        '/api/students/posts/post-1/comments/comment-1',
        { content: 'Edited comment' },
      )
    })

    comment = screen.getByText('Current student comment').closest('.social-comment')
    fireEvent.click(within(comment).getByRole('button', { name: 'Delete' }))
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        '/api/students/posts/post-1/comments/comment-1',
      )
    })
  })
})
