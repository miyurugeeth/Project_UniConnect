import { useCallback, useEffect, useState } from 'react'
import {
  api,
  AUTH_STORAGE_KEY,
  clearStoredAuthentication,
  getStoredAuthentication,
} from '../services/api'
import { AuthContext } from './auth-context'

const allowedRoles = new Set(['STUDENT', 'PROFESSIONAL', 'ADMIN'])

function createSafeAuthentication(response) {
  if (
    typeof response?.accessToken !== 'string' ||
    response.accessToken.length === 0 ||
    response.tokenType !== 'Bearer' ||
    !allowedRoles.has(response.role) ||
    typeof response.userId !== 'string' ||
    typeof response.fullName !== 'string' ||
    typeof response.email !== 'string'
  ) {
    throw new Error('The sign-in response was not valid.')
  }

  return {
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresInSeconds:
      Number.isFinite(response.expiresInSeconds) && response.expiresInSeconds > 0
        ? response.expiresInSeconds
        : null,
    user: {
      userId: response.userId,
      role: response.role,
      fullName: response.fullName,
      email: response.email,
      profileImageUrl:
        typeof response.profileImageUrl === 'string' ? response.profileImageUrl : null,
    },
  }
}

export function AuthProvider({ children }) {
  const [authentication, setAuthentication] = useState(getStoredAuthentication)

  useEffect(() => {
    function handleAuthenticationCleared() {
      setAuthentication(null)
    }

    window.addEventListener(
      'uniconnect:authentication-cleared',
      handleAuthenticationCleared,
    )

    return () => {
      window.removeEventListener(
        'uniconnect:authentication-cleared',
        handleAuthenticationCleared,
      )
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    const safeAuthentication = createSafeAuthentication(response.data)

    window.sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(safeAuthentication),
    )
    setAuthentication(safeAuthentication)

    return safeAuthentication.user
  }, [])

  const logout = useCallback(() => {
    clearStoredAuthentication()
    setAuthentication(null)
  }, [])

  const value = {
    authentication,
    user: authentication?.user ?? null,
    isAuthenticated: Boolean(authentication?.accessToken),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

