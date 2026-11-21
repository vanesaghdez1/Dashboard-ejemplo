import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { homePathFor, useAuth } from './auth-context'
import type { UserRole } from '../../types/api'

/** Si no hay sesión, manda al login (recordando a dónde quería ir). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullScreenLoader />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

/**
 * Solo deja pasar a ciertos roles; a los demás los manda a su página inicial.
 * OJO: esto es solo para la experiencia de usuario. La seguridad real está en la API,
 * que responde 403 aunque alguien se salte esta pantalla.
 */
export function RoleGate({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth()
  if (!user) return null
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

function FullScreenLoader() {
  return (
    <div className="text-ink-3 grid min-h-screen place-items-center text-sm" aria-busy="true">
      Cargando sesión…
    </div>
  )
}
