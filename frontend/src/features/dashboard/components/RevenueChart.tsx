import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthlySales } from '../../../types/api'
import { formatCompactCurrency, formatCurrency, formatMonth, formatNumber, isCurrentMonth } from '../../../lib/format'

/** Ingresos por mes: una sola serie (azul), línea de 2px, relleno suave, tooltip con cruz. */
export function RevenueChart({ data }: { data: MonthlySales[] }) {
  const points = data.map((m) => ({ ...m, label: formatMonth(m.year, m.month) }))

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickFormatter={formatCompactCurrency}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            width={72}
          />
          <Tooltip
            cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as MonthlySales | undefined
              if (!active || !p) return null
              return (
                <div className="border-line bg-surface rounded-lg border px-3 py-2 text-xs shadow-lg">
                  <div className="text-ink-2 mb-1">
                    {formatMonth(p.year, p.month, true)}
                    {isCurrentMonth(p.year, p.month) && <span className="text-ink-3"> · en curso</span>}
                  </div>
                  <div className="text-ink tabular font-semibold">{formatCurrency(p.revenue)}</div>
                  <div className="text-ink-3 tabular">{formatNumber(p.orders)} ventas</div>
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
            activeDot={{ r: 5, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
