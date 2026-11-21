import { createContext, useContext } from 'react'
import type { User, UserRole } from '../../types/api'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Acceso a la sesión desde cualquier componente: const { user, logout } = useAuth() */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}

export const ROLE_LABELS: Record<UserRole, string> = {
  Admin: 'Administrador',
  Manager: 'Gerente',
  Seller: 'Vendedor',
}

/** Roles que pueden ver el dashboard financiero (debe coincidir con la política del backend). */
export const DASHBOARD_ROLES: UserRole[] = ['Admin', 'Manager']

/** Página inicial según el rol. */
export const homePathFor = (user: User) => (DASHBOARD_ROLES.includes(user.role) ? '/' : '/productos')
