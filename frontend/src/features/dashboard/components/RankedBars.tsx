import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactCurrency, formatCurrency } from '../../../lib/format'

export interface RankedItem {
  name: string
  value: number
  detail: string
}

/**
 * Barras horizontales ordenadas (ranking). Una sola medida → un solo color.
 * Etiqueta directa del valor al final de cada barra; detalle completo en el tooltip.
 */
export function RankedBars({ items }: { items: RankedItem[] }) {
  const height = Math.max(160, items.length * 44)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barCategoryGap={10}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={150}
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as RankedItem | undefined
              if (!active || !p) return null
              return (
                <div className="border-line bg-surface rounded-lg border px-3 py-2 text-xs shadow-lg">
                  <div className="text-ink-2 mb-1">{p.name}</div>
                  <div className="text-ink tabular font-semibold">{formatCurrency(p.value)}</div>
                  <div className="text-ink-3 tabular">{p.detail}</div>
                </div>
              )
            }}
          />
          <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={18}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => formatCompactCurrency(Number(v))}
              style={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
