import { useState } from 'react'
import { AlertTriangle, DollarSign, Percent, Receipt, ShoppingCart } from 'lucide-react'
import { useBranches, useDashboardSummary } from './queries'
import { Filters, type RangePreset } from './components/Filters'
import { KpiCard } from './components/KpiCard'
import { ChartCard, DataTable } from './components/ChartCard'
import { RevenueChart } from './components/RevenueChart'
import { RankedBars } from './components/RankedBars'
import { formatCurrency, formatMonth, formatNumber, formatPercent, toIsoDate } from '../../lib/format'
import type { DashboardFilter } from '../../types/api'
import { QueryError } from '../../components/QueryError'
import { useAuth } from '../auth/auth-context'

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

export function DashboardPage() {
  const [range, setRange] = useState<RangePreset>('12m')
  const [branchId, setBranchId] = useState('')
  const { user } = useAuth()
  const isManager = user?.role === 'Manager'

  const filter: DashboardFilter = { ...rangeToFilter(range), branchId: branchId || undefined }

  const branches = useBranches()
  const summary = useDashboardSummary(filter)
  const data = summary.data

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-semibold tracking-tight">Resumen de ventas</h1>
          <p className="text-ink-2 text-sm">Indicadores clave por periodo y sucursal</p>
        </div>
        <Filters
          range={range}
          onRangeChange={setRange}
          branchId={branchId}
          onBranchChange={setBranchId}
          branches={branches.data ?? []}
          lockedBranchName={isManager ? user?.branchName : null}
        />
      </header>

      {summary.isError && <QueryError error={summary.error} onRetry={() => summary.refetch()} />}

      {!data && summary.isPending && <DashboardSkeleton />}

      {data && (
        // Mientras llega un filtro nuevo se muestran los datos anteriores atenuados
        <div className={`flex flex-col gap-6 transition-opacity ${summary.isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            <KpiCard label="Ingresos" value={formatCurrency(data.kpis.revenue)} icon={<DollarSign size={16} />} />
            <KpiCard label="Ventas" value={formatNumber(data.kpis.orders)} icon={<ShoppingCart size={16} />} />
            <KpiCard label="Ticket promedio" value={formatCurrency(data.kpis.averageTicket)} icon={<Receipt size={16} />} />
            <KpiCard
              label="Margen bruto"
              value={formatCurrency(data.kpis.grossMargin)}
              icon={<Percent size={16} />}
              hint={data.kpis.revenue > 0 ? `${formatPercent(data.kpis.grossMargin / data.kpis.revenue)} de los ingresos` : undefined}
            />
            <KpiCard
              label="Stock bajo"
              value={formatNumber(data.kpis.lowStockProducts)}
              icon={<AlertTriangle size={16} className={data.kpis.lowStockProducts > 0 ? 'text-warning' : ''} />}
              hint={data.kpis.lowStockProducts > 0 ? 'Productos por resurtir' : 'Inventario sano'}
            />
          </div>

          <ChartCard
            title="Ingresos por mes"
            subtitle="Total vendido (MXN)"
            chart={<RevenueChart data={data.salesByMonth} />}
            table={
              <DataTable
                headers={['Mes', 'Ingresos', 'Ventas']}
                rows={data.salesByMonth.map((m) => [
                  formatMonth(m.year, m.month, true),
                  formatCurrency(m.revenue),
                  formatNumber(m.orders),
                ])}
              />
            }
          />

          <div className={`grid grid-cols-1 gap-6 ${isManager ? '' : 'lg:grid-cols-2'}`}>
            <ChartCard
              title="Productos más vendidos"
              subtitle="Top 5 por ingresos"
              chart={
                <RankedBars
                  items={data.topProducts.map((p) => ({
                    name: p.name,
                    value: p.revenue,
                    detail: `${formatNumber(p.units)} unidades`,
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
                title="Ventas por sucursal"
                subtitle="Ingresos del periodo"
                chart={
                  <RankedBars
                    items={data.salesByBranch.map((b) => ({
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
        </div>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Cargando">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface-2 h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-surface-2 h-80 rounded-xl" />
    </div>
  )
}
