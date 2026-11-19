import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiPost, refreshSession, setAccessToken, setSessionExpiredHandler } from '../../lib/api'
import type { AuthResponse, User } from '../../types/api'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

/**
 * Maneja la sesión de toda la app:
 *  - al cargar la página intenta recuperar la sesión con la cookie (refresh),
 *  - expone login() y logout(),
 *  - si la sesión expira, limpia todo y la app redirige al login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)

  const clearSession = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus('anonymous')
    queryClient.clear() // borra la caché: el siguiente usuario no debe ver datos del anterior
  }, [queryClient])

  // Recuperar sesión al recargar la página (F5)
  useEffect(() => {
    let cancelled = false
    refreshSession().then((session) => {
      if (cancelled) return
      if (session) {
        setUser(session.user)
        setStatus('authenticated')
      } else {
        setStatus('anonymous')
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(clearSession)
    return () => setSessionExpiredHandler(null)
  }, [clearSession])

  const login = useCallback(async (email: string, password: string) => {
    const session = await apiPost<AuthResponse>('/api/auth/login', { email, password })
    setAccessToken(session.accessToken)
    setUser(session.user)
    setStatus('authenticated')
    return session.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiPost('/api/auth/logout')
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(() => ({ status, user, login, logout }), [status, user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
