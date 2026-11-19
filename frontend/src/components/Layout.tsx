import { NavLink, Outlet } from 'react-router'
import { LayoutDashboard, Moon, Package, Sun, Store } from 'lucide-react'
import { useTheme } from '../lib/theme'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/productos', label: 'Productos', icon: Package, end: false },
]

export function Layout() {
  const { theme, toggle } = useTheme()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barra lateral (arriba en móvil) */}
      <aside className="border-line bg-surface flex shrink-0 items-center gap-4 border-b px-4 py-3 md:w-60 md:flex-col md:items-stretch md:border-r md:border-b-0 md:px-3 md:py-5">
        <div className="flex items-center gap-2 md:px-2 md:pb-6">
          <span className="bg-accent grid size-8 place-items-center rounded-lg text-white">
            <Store size={18} aria-hidden />
          </span>
          <span className="text-ink font-semibold tracking-tight">Ventas MX</span>
        </div>

        <nav className="flex flex-1 gap-1 md:flex-col" aria-label="Principal">
          {navItems.map(({ to, label, icon: Icon, end }) => (
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

        <button
          type="button"
          onClick={toggle}
          className="text-ink-2 hover:bg-surface-2 hover:text-ink flex items-center gap-2 rounded-md px-3 py-2 text-sm"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
          <span className="hidden md:inline">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
