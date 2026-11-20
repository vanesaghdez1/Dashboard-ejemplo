import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useBranches, useDashboardSummary } from './queries'
import { Filters, type RangePreset } from './components/Filters'
import { KpiTile, Sparkline } from './components/KpiCard'
import { ChartCard, DataTable } from './components/ChartCard'
import { RevenueHero } from './components/RevenueHero'
import { Leaderboard } from './components/Leaderboard'
import { DailyRhythm } from './components/DailyRhythm'
import { WEEKDAY_NAMES, WEEKDAY_PLURAL, weekdayStats } from './rhythm'
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedPercent,
  formatToday,
  greeting,
  relativeChange,
  toIsoDate,
} from '../../lib/format'
import type { DashboardFilter, DashboardSummary } from '../../types/api'
import { QueryError } from '../../components/QueryError'
import { useAuth } from '../auth/auth-context'
import { ExportButton } from '../../components/ExportButton'

const PERIOD_LABELS: Record<RangePreset, string> = {
  '30d': 'últimos 30 días',
  '3m': 'últimos 3 meses',
  '6m': 'últimos 6 meses',
  '12m': 'últimos 12 meses',
  all: 'todo el histórico',
}

function rangeToFilter(range: RangePreset): Pick<DashboardFilter, 'from' | 'to'> {
  if (range === 'all') return {}
  const to = new Date()
  if (range === '30d') {
    const from = new Date(to)
    from.setDate(from.getDate() - 29)
    return { from: toIsoDate(from), to: toIsoDate(to) }
  }
  // Rangos por meses: meses completos (desde el día 1) incluyendo el mes en curso,
  // para que la gráfica mensual no empiece con un mes a medias.
  const months = { '3m': 3, '6m': 6, '12m': 12 }[range]
  const from = new Date(to.getFullYear(), to.getMonth() - (months - 1), 1)
  return { from: toIsoDate(from), to: toIsoDate(to) }
}

/** Retraso escalonado para que las secciones entren una tras otra. */
const stagger = (i: number) => ({ animationDelay: `${i * 70}ms` })

export function DashboardPage() {
  const [range, setRange] = useState<RangePreset>('12m')
  const [branchId, setBranchId] = useState('')
  const { user } = useAuth()
  const isManager = user?.role === 'Manager'

  const filter: DashboardFilter = { ...rangeToFilter(range), branchId: branchId || undefined }

  const branches = useBranches()
  const summary = useDashboardSummary(filter)
  const data = summary.data

  const branchName = isManager
    ? user?.branchName
    : branches.data?.find((b) => b.id === branchId)?.name
  const firstName = user?.fullName.split(' ')[0]

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado editorial */}
      <header className="rise flex flex-col gap-6">
        <p className="eyebrow">
          {formatToday()} · Resumen ejecutivo · {branchName ?? 'Todas las sucursales'}
        </p>
        <div>
          <div className="max-w-4xl">
            <h1 className="text-ink font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
              {greeting()}, <em className="text-accent">{firstName}</em>.
            </h1>
            {data ? (
              <Narrative data={data} filter={filter} range={range} branchName={branchName} isManager={isManager} />
            ) : (
              <p className="text-ink-3 mt-5 text-lg">Preparando tu resumen…</p>
            )}
          </div>
        </div>
        {/* Barra de filtros: una sola fila arriba de las gráficas */}
        <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <Filters
            range={range}
            onRangeChange={setRange}
            branchId={branchId}
            onBranchChange={setBranchId}
            branches={branches.data ?? []}
            lockedBranchName={isManager ? user?.branchName : null}
          />
          <ExportButton path="/api/dashboard/export" params={{ ...filter }} />
        </div>
      </header>

      {summary.isError && <QueryError error={summary.error} onRetry={() => summary.refetch()} />}

      {!data && summary.isPending && <DashboardSkeleton />}

      {data && (
        // Mientras llega un filtro nuevo se muestran los datos anteriores atenuados
        <div
          className={`grid grid-cols-1 gap-5 transition-opacity lg:grid-cols-12 ${summary.isPlaceholderData ? 'opacity-60' : ''}`}
          aria-busy={summary.isPlaceholderData}
        >
          <RevenueHero data={data} periodLabel={PERIOD_LABELS[range]} isAllTime={range === 'all'} className="lg:col-span-8" style={stagger(1)} />
          <KpiColumn data={data} />

          <ChartCard
            index="02 · Ritmo diario"
            title="¿Qué días se vende más?"
            subtitle={<WeekdayInsight data={data} filter={filter} />}
            className="lg:col-span-12"
            style={stagger(6)}
            chart={<DailyRhythm days={data.salesByDay} from={filter.from} to={filter.to} />}
            table={
              <DataTable
                headers={['Día', 'Ingreso promedio', 'Ventas promedio']}
                rows={weekdayStats(data.salesByDay, filter.from, filter.to).stats.map((s) => [
                  WEEKDAY_NAMES[s.weekday],
                  formatCurrency(s.avgRevenue),
                  s.avgOrders.toFixed(1),
                ])}
              />
            }
          />

          <ChartCard
            index="03 · Productos"
            title="Los más vendidos"
            subtitle="Top 5 por ingresos del periodo"
            className={isManager ? 'lg:col-span-12' : 'lg:col-span-7'}
            style={stagger(7)}
            chart={
              <Leaderboard
                items={data.topProducts.map((p) => ({
                  id: p.productId,
                  name: p.name,
                  value: p.revenue,
                  detail: `${formatNumber(p.units)} uds.`,
                }))}
              />
            }
            table={
              <DataTable
                headers={['Producto', 'Unidades', 'Ingresos']}
                rows={data.topProducts.map((p) => [p.name, formatNumber(p.units), formatCurrency(p.revenue)])}
              />
            }
          />

          {/* Comparar sucursales solo tiene sentido si ves más de una (Admin) */}
          {!isManager && (
            <ChartCard
              index="04 · Sucursales"
              title="Participación"
              subtitle="Ingresos y % del total"
              className="lg:col-span-5"
              style={stagger(8)}
              chart={
                <Leaderboard
                  showShare
                  items={data.salesByBranch.map((b) => ({
                    id: b.branchId,
                    name: b.branch,
                    value: b.revenue,
                    detail: `${formatNumber(b.orders)} ventas`,
                  }))}
                />
              }
              table={
                <DataTable
                  headers={['Sucursal', 'Ventas', 'Ingresos']}
                  rows={data.salesByBranch.map((b) => [b.branch, formatNumber(b.orders), formatCurrency(b.revenue)])}
                />
              }
            />
          )}
        </div>
      )}
    </div>
  )
}

/** Columna de indicadores secundarios junto al bloque principal. */
function KpiColumn({ data }: { data: DashboardSummary }) {
  const { kpis, previous } = data
  // Tendencia: por mes si hay 3+ meses; si no, por día
  const series =
    data.salesByMonth.length >= 3
      ? data.salesByMonth.map((m) => ({ revenue: m.revenue, orders: m.orders }))
      : data.salesByDay.map((d) => ({ revenue: d.revenue, orders: d.orders }))
  const marginRate = kpis.revenue > 0 ? kpis.grossMargin / kpis.revenue : 0

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
      <KpiTile
        label="Ventas"
        value={kpis.orders}
        format={(v) => formatNumber(Math.round(v))}
        change={relativeChange(kpis.orders, previous?.orders)}
        aside={<Sparkline values={series.map((s) => s.orders)} label="Tendencia de número de ventas" />}
        style={stagger(2)}
      />
      <KpiTile
        label="Ticket promedio"
        value={kpis.averageTicket}
        format={(v) => formatCurrency(Math.round(v))}
        change={relativeChange(kpis.averageTicket, previous?.averageTicket)}
        aside={
          <Sparkline
            values={series.map((s) => (s.orders ? s.revenue / s.orders : 0))}
            label="Tendencia del ticket promedio"
          />
        }
        style={stagger(3)}
      />
      <KpiTile
        label="Margen bruto"
        value={marginRate * 100}
        format={(v) => `${v.toFixed(1)} %`}
        footer={<span className="text-ink-3 font-mono">{formatCompactCurrency(kpis.grossMargin)} de utilidad</span>}
        aside={<MarginRing rate={marginRate} />}
        style={stagger(4)}
      />
      <KpiTile
        label="Stock bajo"
        value={kpis.lowStockProducts}
        format={(v) => formatNumber(Math.round(v))}
        footer={
          <Link to="/productos" className="text-ink-2 hover:text-accent inline-flex items-center gap-1 font-mono">
            Ver catálogo <ArrowRight size={12} aria-hidden />
          </Link>
        }
        aside={
          kpis.lowStockProducts > 0 ? (
            <span className="text-warning flex items-center gap-1.5 text-xs font-medium">
              <AlertTriangle size={16} aria-hidden /> Por resurtir
            </span>
          ) : (
            <span className="text-good flex items-center gap-1.5 text-xs font-medium">
              <CheckCircle2 size={16} aria-hidden /> Inventario sano
            </span>
          )
        }
        style={stagger(5)}
      />
    </div>
  )
}

/** Anillo de progreso para el margen (porcentaje de cada peso que queda como utilidad). */
function MarginRing({ rate }: { rate: number }) {
  const r = 18
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 48 48" className="size-14 -rotate-90" aria-hidden>
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(Math.max(rate, 0), 1))}
        className="transition-[stroke-dashoffset] duration-1000"
      />
    </svg>
  )
}

/** Cifra resaltada dentro del texto narrativo. */
function Hl({ children }: { children: ReactNode }) {
  return (
    <strong className="text-ink decoration-accent font-medium underline decoration-2 underline-offset-[5px]">
      {children}
    </strong>
  )
}

/**
 * Resumen en lenguaje natural generado a partir de los datos:
 * lo que un director leería primero, sin tener que interpretar gráficas.
 */
function Narrative(props: {
  data: DashboardSummary
  filter: DashboardFilter
  range: RangePreset
  branchName?: string | null
  isManager: boolean
}) {
  const { data, filter, range, branchName, isManager } = props
  const { kpis, previous } = data
  const change = relativeChange(kpis.revenue, previous?.revenue)
  const topBranch = data.salesByBranch[0]
  const topProduct = data.topProducts[0]
  const { best } = weekdayStats(data.salesByDay, filter.from, filter.to)

  if (kpis.orders === 0)
    return <p className="text-ink-2 mt-5 text-lg md:text-xl">No hay ventas registradas en {PERIOD_LABELS[range]}.</p>

  const scope = branchName ? branchName : `las ${data.salesByBranch.length} sucursales`

  return (
    <p className="text-ink-2 mt-5 text-lg leading-relaxed md:text-xl">
      {range === 'all' ? 'En todo el histórico' : `En los ${PERIOD_LABELS[range]}`}, {scope}{' '}
      {branchName ? 'facturó' : 'facturaron'} <Hl>{formatCompactCurrency(kpis.revenue)}</Hl> en{' '}
      <Hl>{formatNumber(kpis.orders)} ventas</Hl>
      {change !== null && (
        <>
          , <Hl>{formatSignedPercent(change)}</Hl> frente al periodo anterior
        </>
      )}
      .{' '}
      {!isManager && !branchName && topBranch && kpis.revenue > 0 && (
        <>
          <Hl>{topBranch.branch}</Hl> aporta el {formatPercent(topBranch.revenue / kpis.revenue)} de los ingresos.{' '}
        </>
      )}
      {topProduct && (
        <>
          El producto estrella es <Hl>{topProduct.name}</Hl> y los <Hl>{WEEKDAY_PLURAL[best.weekday]}</Hl> son el mejor
          día.{' '}
        </>
      )}
      {kpis.lowStockProducts > 0 && (
        <>
          Hay <Hl>{kpis.lowStockProducts} productos</Hl> por resurtir.
        </>
      )}
    </p>
  )
}

function WeekdayInsight({ data, filter }: { data: DashboardSummary; filter: DashboardFilter }) {
  const { best, uplift } = weekdayStats(data.salesByDay, filter.from, filter.to)
  if (!best.avgRevenue) return <>Cada cuadro es un día; más intenso = más ingresos.</>
  return (
    <>
      Cada cuadro es un día; más intenso = más ingresos. Los <span className="text-ink">{WEEKDAY_PLURAL[best.weekday]}</span>{' '}
      promedian <span className="text-ink tabular">{formatCurrency(best.avgRevenue)}</span>
      {uplift > 0.01 && <>, {formatPercent(uplift)} más que un día típico</>}.
    </>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-5 lg:grid-cols-12" aria-busy="true" aria-label="Cargando">
      <div className="bg-surface-2 h-[440px] rounded-[24px] lg:col-span-8" />
      <div className="flex flex-col gap-5 lg:col-span-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-2 h-24 rounded-[20px]" />
        ))}
      </div>
      <div className="bg-surface-2 h-64 rounded-[20px] lg:col-span-12" />
    </div>
  )
}
