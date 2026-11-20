import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthlySales } from '../../../types/api'
import { formatCompactCurrency, formatCurrency, formatMonth, formatNumber, isCurrentMonth } from '../../../lib/format'

const tick = { fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }

/**
 * Ingresos por mes: una sola serie (color de acento), línea de 2px, relleno suave,
 * tooltip con cruz y una sola etiqueta directa: el mes pico.
 */
export function RevenueChart({ data, height = 280 }: { data: MonthlySales[]; height?: number }) {
  const points = data.map((m) => ({ ...m, label: formatMonth(m.year, m.month) }))
  const peakIndex = points.length > 2 ? points.reduce((best, p, i) => (p.revenue > points[best].revenue ? i : best), 0) : -1
  const peak = peakIndex >= 0 ? points[peakIndex] : null
  // En los extremos, la etiqueta va de lado para no chocar con el eje
  const labelPosition = peakIndex === 0 ? 'right' : peakIndex === points.length - 1 ? 'left' : 'top'

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 28, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="2 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={tick}
            interval="preserveStartEnd"
            minTickGap={20}
            dy={6}
          />
          <YAxis tickFormatter={formatCompactCurrency} tickLine={false} axisLine={false} tick={tick} width={64} />
          <Tooltip
            cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as MonthlySales | undefined
              if (!active || !p) return null
              return (
                <div className="border-line bg-surface rounded-xl border px-3 py-2.5 text-xs shadow-xl">
                  <div className="eyebrow mb-1">
                    {formatMonth(p.year, p.month, true)}
                    {isCurrentMonth(p.year, p.month) && ' · en curso'}
                  </div>
                  <div className="text-ink tabular font-serif text-xl leading-tight">{formatCurrency(p.revenue)}</div>
                  <div className="text-ink-3 tabular font-mono">{formatNumber(p.orders)} ventas</div>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#revenueFill)"
            animationDuration={1100}
            activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
          />
          {peak && (
            <ReferenceDot
              x={peak.label}
              y={peak.revenue}
              r={4}
              fill="var(--surface)"
              stroke="var(--accent)"
              strokeWidth={2}
              label={{
                value: `Pico · ${formatCompactCurrency(peak.revenue)}`,
                position: labelPosition,
                offset: 12,
                fill: 'var(--text-secondary)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
