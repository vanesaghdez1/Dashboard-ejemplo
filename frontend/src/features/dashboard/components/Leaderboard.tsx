import { formatCompactCurrency, formatCurrency, formatPercent } from '../../../lib/format'

export interface LeaderboardItem {
  id: string
  name: string
  value: number
  detail: string
}

/**
 * Ranking editorial: número grande en serif, nombre, barra fina proporcional y valor al final.
 * Una sola medida → un solo color. Los valores van rotulados, así que no hace falta tooltip;
 * el valor exacto aparece al pasar el mouse (title) y en la vista de tabla.
 */
export function Leaderboard({ items, showShare = false }: { items: LeaderboardItem[]; showShare?: boolean }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  const total = items.reduce((sum, i) => sum + i.value, 0) || 1

  return (
    <ol className="flex flex-col">
      {items.map((item, index) => (
        <li
          key={item.id}
          title={`${item.name}: ${formatCurrency(item.value)}`}
          className="group border-line grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 border-b border-dashed py-3 last:border-0"
        >
          <span
            className={`font-serif text-3xl leading-none italic tabular ${index === 0 ? 'text-accent' : 'text-ink-3'}`}
            aria-hidden
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-ink truncate text-sm font-medium">{item.name}</span>
              <span className="text-ink-3 hidden shrink-0 font-mono text-[11px] sm:inline">{item.detail}</span>
            </div>
            <div className="bg-surface-2 mt-2 h-1.5 overflow-hidden rounded-full">
              <div
                className="grow-x bg-accent h-full rounded-full transition-[width] duration-500 group-hover:brightness-110"
                style={{ width: `${(item.value / max) * 100}%`, animationDelay: `${index * 70}ms` }}
              />
            </div>
          </div>

          <div className="text-right">
            <div className="text-ink tabular font-mono text-sm">{formatCompactCurrency(item.value)}</div>
            {showShare && (
              <div className="text-ink-3 tabular font-mono text-[11px]">{formatPercent(item.value / total)}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
