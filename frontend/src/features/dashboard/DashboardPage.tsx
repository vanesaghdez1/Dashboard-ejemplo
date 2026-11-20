import { useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { useBranches, useDashboardSummary } from './queries'
import { Filters, type RangePreset } from './components/Filters'
import { KpiTile, Sparkline } from './components/KpiCard'
import { ChartCard, DataTable } from './components/ChartCard'
import { RevenueHero } from './components/RevenueHero'
import { Leaderboard } from './components/Leaderboard'
import { DailyRhythm } from './components/DailyRhythm'
import { WEEKDAY_NAMES, weekdayStats } from './rhythm'
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
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
      {/* Encabezado compacto: saludo a la izquierda, filtros a la derecha */}
      <header className="rise flex flex-col gap-5">
        <div>
          <p className="eyebrow">
            {formatToday()} · {branchName ?? 'Todas las sucursales'}
          </p>
          <h1 className="text-ink mt-1 font-serif text-4xl leading-none tracking-tight md:text-5xl">
            {greeting()}, <em className="text-accent">{firstName}</em>
          </h1>
        </div>
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
            title="Ritmo diario"
            subtitle={<BestDay data={data} filter={filter} />}
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
            title="Top productos"
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
              title="Sucursales"
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

/** Mejor día de la semana como dato visual (sin frase). */
function BestDay({ data, filter }: { data: DashboardSummary; filter: DashboardFilter }) {
  const { best, uplift } = weekdayStats(data.salesByDay, filter.from, filter.to)
  if (!best.avgRevenue) return null
  return (
    <span className="flex flex-wrap items-center gap-2 font-mono text-xs">
      <span className="eyebrow">Mejor día</span>
      <span className="bg-accent-soft text-ink rounded-full px-2.5 py-0.5 font-sans text-sm font-medium">
        {WEEKDAY_NAMES[best.weekday]}
      </span>
      <span className="text-ink tabular">{formatCompactCurrency(best.avgRevenue)}/día</span>
      {uplift > 0.01 && (
        <span className="text-good inline-flex items-center gap-0.5">
          <ArrowUpRight size={14} aria-hidden />
          {formatPercent(uplift)}
          <span className="sr-only">más que un día típico</span>
        </span>
      )}
    </span>
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
