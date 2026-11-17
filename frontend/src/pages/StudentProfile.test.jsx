/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { api } from '../services/api'
import StudentProfile from './StudentProfile'

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ user: { userId: 'student-1' } }),
}))

const profile = {
  id: 'student-2',
  fullName: 'Ada Student',
  profileImageUrl: null,
  universityName: 'Example University',
  faculty: 'Engineering',
  departmentOrField: 'Computer Science',
  batchYear: 2023,
  currentAcademicYear: 3,
  skills: ['Java', 'SQL'],
  interests: ['Robotics'],
  followerCount: 1,
  followingCount: 2,
  followedByCurrentUser: false,
}

afterEach(cleanup)

it('loads and displays the selected student profile', async () => {
  api.get.mockResolvedValue({ data: profile })

  render(
    <MemoryRouter initialEntries={['/student/profiles/student-2']}>
      <Routes>
        <Route path="/student/profiles/:studentId" element={<StudentProfile />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(await screen.findByRole('heading', { name: 'Ada Student' })).toBeTruthy()
  expect(screen.getByText('Example University · Engineering · Computer Science')).toBeTruthy()
  expect(screen.getByText('2023')).toBeTruthy()
  expect(screen.getByText('Java, SQL')).toBeTruthy()
  expect(api.get).toHaveBeenCalledWith(
    '/api/students/student-2',
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  )
})

it('follows a student and loads their followers', async () => {
  api.get.mockImplementation((url) => {
    if (url === '/api/students/student-2') return Promise.resolve({ data: profile })
    if (url.endsWith('/followers')) {
      return Promise.resolve({
        data: {
          content: [
            {
              id: 'student-3',
              fullName: 'Grace Student',
              universityName: 'Example University',
              faculty: 'Science',
            },
          ],
          number: 0,
          totalPages: 1,
        },
      })
    }
    return Promise.reject(new Error(`Unexpected request: ${url}`))
  })
  api.post.mockResolvedValue({ data: { following: true, followerCount: 2 } })

  render(
    <MemoryRouter initialEntries={['/student/profiles/student-2']}>
      <Routes>
        <Route path="/student/profiles/:studentId" element={<StudentProfile />} />
      </Routes>
    </MemoryRouter>,
  )

  fireEvent.click(await screen.findByRole('button', { name: 'Follow' }))
  expect(await screen.findByRole('button', { name: 'Unfollow' })).toBeTruthy()
  expect(api.post).toHaveBeenCalledWith('/api/students/student-2/follow')

  fireEvent.click(screen.getByRole('button', { name: '2 followers' }))
  expect(await screen.findByRole('link', { name: /Grace Student/ })).toBeTruthy()
  expect(api.get).toHaveBeenCalledWith(
    '/api/students/student-2/followers',
    { params: { page: 0, size: 20 } },
  )
})
