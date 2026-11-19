/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext.jsx'
import AppShell from './AppShell'

const authState = vi.hoisted(() => ({
  user: null,
  logout: vi.fn(),
}))

vi.mock('../context/useAuth', () => ({
  useAuth: () => authState,
}))

function CurrentLocation() {
  const location = useLocation()
  return <p data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</p>
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/student/feed']}>
      <ThemeProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/student/feed" element={<CurrentLocation />} />
            <Route path="/student/profiles/:studentId" element={<CurrentLocation />} />
            <Route path="/student/dashboard" element={<CurrentLocation />} />
            <Route path="/professional/dashboard" element={<CurrentLocation />} />
            <Route path="/messages" element={<CurrentLocation />} />
            <Route path="/notifications" element={<CurrentLocation />} />
            <Route path="/login" element={<p>Login destination</p>} />
          </Route>
        </Routes>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  authState.user = {
    userId: 'student-1',
    role: 'STUDENT',
    fullName: 'Current Student',
    email: 'student@example.lk',
  }
  authState.logout.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('AppShell', () => {
  it('provides sidebar navigation, mobile menu, theme toggle, and logout', () => {
    renderShell()

    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'My Posts' }).getAttribute('href')).toBe(
      '/student/feed?mine=true',
    )
    expect(screen.getByRole('link', { name: 'Connections' }).getAttribute('href')).toBe(
      '/student/feed?view=connections',
    )

    const menuButton = screen.getByRole('button', { name: 'Open navigation menu' })
    fireEvent.click(menuButton)
    expect(menuButton.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(screen.getByRole('link', { name: 'Create Post' }))
    expect(screen.getByTestId('location').textContent).toBe('/student/feed?compose=true')

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: /Log out/i }))
    expect(authState.logout).toHaveBeenCalledOnce()
    expect(screen.getByText('Login destination')).toBeTruthy()
  })

  it('keeps professional profile navigation separate from student information', () => {
    authState.user = {
      userId: 'professional-1',
      role: 'PROFESSIONAL',
      fullName: 'Current Professional',
      email: 'professional@example.lk',
    }
    renderShell()

    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe(
      '/student/feed',
    )
    expect(screen.getByRole('link', { name: 'Profile' }).getAttribute('href')).toBe(
      '/professional/dashboard',
    )
    expect(screen.getByRole('link', { name: 'Connections' }).getAttribute('href')).toBe(
      '/student/feed?view=connections',
    )
  })
})
