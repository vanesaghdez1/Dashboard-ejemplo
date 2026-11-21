import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { LayoutDashboard, LogOut, Moon, Package, Search, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { DASHBOARD_ROLES, ROLE_LABELS, useAuth } from '../features/auth/auth-context'
import type { Product, UserRole } from '../types/api'
import { CommandPalette, type PaletteAction } from './CommandPalette'
import { Logo } from './Logo'

const navItems: { to: string; label: string; icon: typeof Package; end: boolean; roles?: UserRole[] }[] = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true, roles: DASHBOARD_ROLES },
  { to: '/productos', label: 'Catálogo', icon: Package, end: false },
]

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function Layout() {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)

  // El menú solo muestra lo que el rol puede ver
  const visibleItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)))

  // Atajo global Ctrl/⌘ + K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const actions: PaletteAction[] = [
    ...visibleItems.map(({ to, label, icon: Icon }) => ({
      id: `nav-${to}`,
      label: `Ir a ${label}`,
      icon: <Icon size={16} aria-hidden />,
      group: 'Navegación',
      run: () => navigate(to),
    })),
    {
      id: 'theme',
      label: theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
      icon: theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />,
      group: 'Preferencias',
      run: toggle,
    },
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: <LogOut size={16} aria-hidden />,
      group: 'Cuenta',
      run: () => void logout(),
    },
  ]

  const openProduct = useCallback(
    (p: Product) => navigate(`/productos?q=${encodeURIComponent(p.sku)}`),
    [navigate],
  )

  const initials = user?.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="min-h-screen">
      <header className="border-line bg-bg/80 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:gap-6 md:px-8">
          <NavLink to="/" className="shrink-0" aria-label="Ventas MX, inicio">
            <Logo />
          </NavLink>

          <nav className="flex h-full items-stretch gap-1 md:gap-2" aria-label="Principal">
            {visibleItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-2 text-sm transition-colors md:px-3 ${
                    isActive
                      ? "text-ink font-medium after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--accent)] after:content-['']"
                      : 'text-ink-3 hover:text-ink'
                  }`
                }
              >
                <Icon size={16} aria-hidden className="sm:hidden" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="border-line bg-surface text-ink-3 hover:text-ink flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors"
              aria-label="Abrir búsqueda y comandos"
            >
              <Search size={15} aria-hidden />
              <span className="hidden lg:inline">Buscar o ir a…</span>
              <kbd className="hidden font-mono text-[11px] md:inline">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>

            <button
              type="button"
              onClick={toggle}
              className="text-ink-3 hover:text-ink hover:bg-surface-2 grid size-9 place-items-center rounded-full transition-colors"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
            </button>

            {user && (
              <div className="border-line ml-1 flex items-center gap-2.5 border-l pl-3">
                <span
                  className="bg-ink text-bg grid size-8 place-items-center rounded-full font-mono text-xs font-semibold"
                  aria-hidden
                >
                  {initials}
                </span>
                <div className="hidden min-w-0 leading-tight xl:block">
                  <p className="text-ink truncate text-sm font-medium">{user.fullName}</p>
                  <p className="text-ink-3 truncate font-mono text-[11px]">
                    {ROLE_LABELS[user.role]}
                    {user.branchName && ` · ${user.branchName}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="text-ink-3 hover:text-critical hover:bg-surface-2 grid size-9 place-items-center rounded-full transition-colors"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
        <Outlet />
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        actions={actions}
        onProductSelected={openProduct}
      />
    </div>
  )
}
