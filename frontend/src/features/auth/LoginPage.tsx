import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { homePathFor, ROLE_LABELS, useAuth } from './auth-context'
import type { UserRole } from '../../types/api'
import { Logo } from '../../components/Logo'

// Cuentas públicas de demostración (se crean en DataSeeder.cs).
const DEMO_PASSWORD = 'Demo123!'
const DEMO_ACCOUNTS: { email: string; role: UserRole; initials: string; description: string }[] = [
  { email: 'admin@ventasmx.demo', role: 'Admin', initials: 'AA', description: 'Todas las sucursales y catálogo' },
  { email: 'gerente@ventasmx.demo', role: 'Manager', initials: 'GG', description: 'Solo Monterrey' },
  { email: 'vendedor@ventasmx.demo', role: 'Seller', initials: 'VV', description: 'Catálogo, sin finanzas' },
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
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca: solo logo y visual, sin texto de relleno */}
      <aside className="panel-ink relative flex min-h-[220px] flex-col justify-between gap-10 overflow-hidden p-8 md:p-12">
        <Logo size="lg" />
        <DecorativeRhythm />
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-md">
          <h1 className="text-ink font-serif text-5xl tracking-tight">Inicia sesión</h1>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6" noValidate>
            {error && (
              <div role="alert" className="border-critical/40 text-ink flex items-center gap-2 rounded-xl border p-3 text-sm">
                <AlertCircle size={16} className="text-critical shrink-0" aria-hidden />
                {error}
              </div>
            )}

            <UnderlineField label="Correo">
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.mx"
                className="text-ink placeholder:text-ink-3 w-full bg-transparent py-2 text-lg outline-none"
              />
            </UnderlineField>

            <UnderlineField label="Contraseña">
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="text-ink placeholder:text-ink-3 w-full bg-transparent py-2 text-lg outline-none"
              />
            </UnderlineField>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="group bg-ink text-bg flex items-center justify-between rounded-full py-3 pr-3 pl-6 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? 'Entrando…' : 'Entrar'}
              <span className="bg-accent text-on-accent grid size-8 place-items-center rounded-full transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={16} aria-hidden />
              </span>
            </button>
          </form>

          <section className="mt-10" aria-labelledby="demo-heading">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="demo-heading" className="eyebrow">
                Demo
              </h2>
              <span className="text-ink-3 font-mono text-[11px]">
                clave <code className="text-ink-2">{DEMO_PASSWORD}</code>
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => void signIn(account.email, DEMO_PASSWORD)}
                  title={account.description}
                  className="group border-line bg-surface hover:border-accent flex min-w-0 items-center gap-3 rounded-2xl border p-3 text-left sm:flex-col sm:items-start sm:gap-2 transition-colors disabled:opacity-50"
                >
                  <span className="bg-surface-2 text-ink group-hover:bg-accent group-hover:text-on-accent grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold transition-colors">
                    {account.initials}
                  </span>
                  <span className="text-ink text-sm font-medium">{ROLE_LABELS[account.role]}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function UnderlineField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="border-line focus-within:border-accent block border-b-2 transition-colors [&_input:focus-visible]:outline-none">
      <span className="eyebrow">{label}</span>
      {children}
    </label>
  )
}

/** Decoración: mini mapa de calor que "se enciende" y una curva que se dibuja. Solo visual. */
function DecorativeRhythm() {
  const cols = 26
  // Pseudoaleatorio determinista: siempre el mismo dibujo (sin parpadeos entre renders)
  const level = (c: number, r: number) => {
    const weekend = r >= 5 ? 1.5 : 1
    const trend = 0.4 + (c / cols) * 0.6
    const noise = Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1
    return Math.min(1, trend * weekend * (0.45 + noise * 0.6))
  }

  return (
    <div className="pointer-events-none relative z-0 -mx-2" aria-hidden>
      <svg viewBox="0 0 520 120" className="mb-4 w-full overflow-visible">
        <path
          d="M0,100 C40,96 60,80 100,84 S170,60 210,66 S280,40 320,48 S400,20 440,26 S500,8 520,6"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
          style={{ animation: 'draw 2.2s .3s cubic-bezier(.2,.7,.2,1) forwards' }}
        />
        <circle cx="520" cy="6" r="5" fill="var(--gold)" className="rise" style={{ animationDelay: '2.3s' }} />
      </svg>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols * 7 }).map((_, i) => {
          const c = Math.floor(i / 7)
          const r = i % 7
          const v = level(c, r)
          return (
            <span
              key={i}
              className="rise aspect-square rounded-[3px]"
              style={{
                gridColumn: c + 1,
                gridRow: r + 1,
                background: `color-mix(in oklab, var(--accent) ${Math.round(v * 100)}%, var(--surface-2))`,
                animationDelay: `${300 + c * 45 + r * 20}ms`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
