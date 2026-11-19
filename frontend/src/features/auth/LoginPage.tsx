import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { AlertCircle, LogIn, Store } from 'lucide-react'
import { homePathFor, ROLE_LABELS, useAuth } from './auth-context'
import type { UserRole } from '../../types/api'

// Cuentas públicas de demostración (se crean en DataSeeder.cs).
const DEMO_PASSWORD = 'Demo123!'
const DEMO_ACCOUNTS: { email: string; role: UserRole; description: string }[] = [
  { email: 'admin@ventasmx.demo', role: 'Admin', description: 'Todo: todas las sucursales' },
  { email: 'gerente@ventasmx.demo', role: 'Manager', description: 'Dashboard de Monterrey' },
  { email: 'vendedor@ventasmx.demo', role: 'Seller', description: 'Solo productos' },
]

export function LoginPage() {
  const { status, user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Si ya hay sesión, no tiene sentido mostrar el login
  if (status === 'authenticated' && user) return <Navigate to={homePathFor(user)} replace />

  async function signIn(emailValue: string, passwordValue: string) {
    setError(null)
    setSubmitting(true)
    try {
      const loggedUser = await login(emailValue, passwordValue)
      navigate(from && from !== '/login' ? from : homePathFor(loggedUser), { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void signIn(email, password)
  }

  return (
    <div className="bg-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="bg-accent grid size-9 place-items-center rounded-lg text-white">
            <Store size={20} aria-hidden />
          </span>
          <span className="text-ink text-lg font-semibold tracking-tight">Ventas MX</span>
        </div>

        <form onSubmit={handleSubmit} className="border-line bg-surface flex flex-col gap-4 rounded-xl border p-6" noValidate>
          <div>
            <h1 className="text-ink text-xl font-semibold tracking-tight">Iniciar sesión</h1>
            <p className="text-ink-2 text-sm">Accede al panel de ventas</p>
          </div>

          {error && (
            <div role="alert" className="border-critical/40 text-ink flex items-center gap-2 rounded-lg border p-3 text-sm">
              <AlertCircle size={16} className="text-critical shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-2">Correo</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-line bg-bg text-ink rounded-lg border px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-2">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-line bg-bg text-ink rounded-lg border px-3 py-2"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="bg-accent flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <LogIn size={16} aria-hidden />
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <section className="mt-6" aria-labelledby="demo-heading">
          <h2 id="demo-heading" className="text-ink-3 mb-2 text-center text-xs">
            Cuentas de demostración · contraseña <code className="text-ink-2">{DEMO_PASSWORD}</code>
          </h2>
          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={submitting}
                onClick={() => void signIn(account.email, DEMO_PASSWORD)}
                className="border-line bg-surface hover:bg-surface-2 flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-50"
              >
                <span>
                  <span className="text-ink block font-medium">{ROLE_LABELS[account.role]}</span>
                  <span className="text-ink-3 block text-xs">{account.description}</span>
                </span>
                <span className="text-ink-3 text-xs">Entrar →</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
