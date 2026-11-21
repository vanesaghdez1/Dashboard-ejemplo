import { useState, type CSSProperties } from 'react'
import type { DashboardSummary } from '../../../types/api'
import {
  formatCompactCurrency,
  formatCurrency,
  formatDayMonth,
  formatMonth,
  formatNumber,
  relativeChange,
} from '../../../lib/format'
import { useCountUp } from '../../../lib/useCountUp'
import { DeltaBadge } from './KpiCard'
import { DataTable, ViewToggle } from './ChartCard'
import { RevenueChart } from './RevenueChart'

interface RevenueHeroProps {
  data: DashboardSummary
  periodLabel: string
  isAllTime: boolean
  className?: string
  style?: CSSProperties
}

/**
 * Bloque protagonista: ingresos del periodo en grande, comparación y la curva mensual.
 * Usa el "panel tinta" (oscuro también en modo claro) para que sea lo primero que se lee.
 */
export function RevenueHero({ data, periodLabel, isAllTime, className = '', style }: RevenueHeroProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const revenue = data.kpis.revenue
  const animated = useCountUp(revenue, 1200)
  const previous = data.previous
  const change = relativeChange(revenue, previous?.revenue)

  return (
    <section
      className={`panel-ink shadow-card rise relative overflow-hidden rounded-[24px] p-6 md:p-8 ${className}`}
      style={style}
      aria-labelledby="hero-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p id="hero-title" className="eyebrow">
            Ingresos · {periodLabel}
          </p>
          <p className="text-ink tabular mt-3 font-serif text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] tracking-tight">
            <span className="sr-only">{formatCurrency(revenue)}</span>
            <span aria-hidden>{formatCurrency(Math.round(animated))}</span>
          </p>
          <div className="text-ink-2 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <DeltaBadge change={change} />
            {previous ? (
              <span
                className="font-mono text-xs"
                title={`Del ${formatDayMonth(previous.from)} al ${formatDayMonth(previous.to)}`}
              >
                vs {formatCompactCurrency(previous.revenue)}
              </span>
            ) : (
              <span className="text-ink-3 font-mono text-xs">
                {isAllTime ? 'Histórico completo' : 'Sin periodo previo'}
              </span>
            )}
          </div>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div className="mt-6 -mr-2 -ml-4 md:mt-8">
        {view === 'chart' ? (
          <RevenueChart data={data.salesByMonth} height={260} />
        ) : (
          <div className="max-h-[260px] overflow-auto pl-4">
            <DataTable
              headers={['Mes', 'Ingresos', 'Ventas']}
              rows={data.salesByMonth.map((m) => [
                formatMonth(m.year, m.month, true),
                formatCurrency(m.revenue),
                formatNumber(m.orders),
              ])}
            />
          </div>
        )}
      </div>
    </section>
  )
}
