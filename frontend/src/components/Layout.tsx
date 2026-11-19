import { NavLink, Outlet } from 'react-router'
import { LayoutDashboard, LogOut, Moon, Package, Store, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { DASHBOARD_ROLES, ROLE_LABELS, useAuth } from '../features/auth/auth-context'
import type { UserRole } from '../types/api'

const navItems: { to: string; label: string; icon: typeof Package; end: boolean; roles?: UserRole[] }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: DASHBOARD_ROLES },
  { to: '/productos', label: 'Productos', icon: Package, end: false },
]

export function Layout() {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()

  // El menú solo muestra lo que el rol puede ver
  const visibleItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barra lateral (arriba en móvil) */}
      <aside className="border-line bg-surface flex shrink-0 items-center gap-2 border-b px-4 py-3 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:items-stretch md:gap-4 md:border-r md:border-b-0 md:px-3 md:py-5">
        <div className="flex items-center gap-2 md:px-2 md:pb-6">
          <span className="bg-accent grid size-8 place-items-center rounded-lg text-white">
            <Store size={18} aria-hidden />
          </span>
          <span className="text-ink hidden font-semibold tracking-tight sm:inline">Ventas MX</span>
        </div>

        <nav className="flex flex-1 gap-1 md:flex-col" aria-label="Principal">
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`
              }
            >
              <Icon size={16} aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="md:border-line hidden min-w-0 px-3 md:block md:border-t md:pt-4">
            <p className="text-ink truncate text-sm font-medium">{user.fullName}</p>
            <p className="text-ink-3 truncate text-xs">
              {ROLE_LABELS[user.role]}
              {user.branchName && ` · ${user.branchName}`}
            </p>
          </div>
        )}

        <div className="flex gap-1 md:flex-col">
          <button
            type="button"
            onClick={toggle}
            className="text-ink-2 hover:bg-surface-2 hover:text-ink flex items-center gap-2 rounded-md px-3 py-2 text-sm"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            <span className="hidden md:inline">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-ink-2 hover:bg-surface-2 hover:text-ink flex items-center gap-2 rounded-md px-3 py-2 text-sm"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} aria-hidden />
            <span className="hidden md:inline">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
