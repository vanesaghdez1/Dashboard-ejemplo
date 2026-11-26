import { useMemo, useRef, useState } from 'react'
import type { DailySales } from '../../../types/api'
import { formatCount, formatCurrency, formatDayFull, formatMonthShort, parseIsoDate, toIsoDate } from '../../../lib/format'
import { buildCells, type Cell } from '../rhythm'

const WEEKDAY_SHORT = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

/** Escala secuencial de un solo tono: superficie → acento (más intenso = más ventas). */
const LEVELS = [
  'var(--surface-2)',
  'color-mix(in oklab, var(--accent) 22%, var(--surface-2))',
  'color-mix(in oklab, var(--accent) 42%, var(--surface-2))',
  'color-mix(in oklab, var(--accent) 62%, var(--surface-2))',
  'color-mix(in oklab, var(--accent) 82%, var(--surface-2))',
  'var(--accent)',
]

/**
 * Mapa de calor tipo calendario: columnas = semanas, filas = días.
 * Deja ver de un vistazo patrones (fines de semana, temporada alta) que una gráfica mensual esconde.
 */
export function DailyRhythm({ days, from, to }: { days: DailySales[]; from?: string; to?: string }) {
  const { cells, weeks } = useMemo(() => buildCells(days, from, to), [days, from, to])
  const containerRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ cell: Cell; x: number; y: number } | null>(null)
  const [todayIso] = useState(() => toIsoDate(new Date()))

  // Etiqueta de mes en la semana donde empieza cada mes
  const monthLabels = useMemo(() => {
    const labels: { col: number; text: string }[] = []
    for (const c of cells) {
      const d = parseIsoDate(c.iso)
      if (d.getUTCDate() === 1 || c === cells[0]) {
        if (labels.at(-1)?.col !== c.col && (labels.length === 0 || c.col - labels.at(-1)!.col >= 3))
          labels.push({ col: c.col, text: formatMonthShort(d) })
      }
    }
    return labels
  }, [cells])

  if (cells.length === 0) return <p className="text-ink-3 py-10 text-center text-sm">No sales in this period.</p>


  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div
          ref={containerRef}
          className="relative grid grid-cols-[2rem_1fr] gap-x-2"
          style={{ minWidth: weeks * 13 + 40 }}
          onMouseLeave={() => setHover(null)}
        >
          {/* Meses */}
          <div />
          <div className="grid h-5" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 26px))` }}>
            {monthLabels.map((m) => (
              <span
                key={`${m.col}-${m.text}`}
                className="text-ink-3 font-mono text-[10px] whitespace-nowrap uppercase"
                style={{ gridColumn: m.col + 1 }}
              >
                {m.text}
              </span>
            ))}
          </div>

          {/* Días de la semana */}
          <div className="grid grid-rows-7 gap-[3px]">
            {WEEKDAY_SHORT.map((d, i) => (
              <span key={i} className="text-ink-3 flex items-center font-mono text-[10px]">
                {d}
              </span>
            ))}
          </div>

          <div
            className="grid grid-rows-7 gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 26px))` }}
            role="img"
            aria-label="Heatmap of daily revenue. Switch to the table view to see the values."
          >
            {cells.map((c) => (
              <span
                key={c.iso}
                onMouseEnter={(e) => {
                  const box = containerRef.current!.getBoundingClientRect()
                  const r = e.currentTarget.getBoundingClientRect()
                  setHover({ cell: c, x: r.left - box.left + r.width / 2, y: r.top - box.top })
                }}
                className="aspect-square w-full rounded-[3px] transition-transform hover:scale-125"
                style={{
                  gridColumn: c.col + 1,
                  gridRow: c.row + 1,
                  background: LEVELS[c.level],
                  // Hoy, marcado con un contorno
                  outline: c.iso === todayIso ? '1.5px solid var(--text-primary)' : undefined,
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>

          {hover && (
            <div
              className="border-line bg-surface pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border px-3 py-2 text-xs whitespace-nowrap shadow-xl"
              style={{ left: hover.x, top: hover.y - 8 }}
            >
              <div className="eyebrow mb-0.5">{formatDayFull(hover.cell.iso)}</div>
              <div className="text-ink tabular font-serif text-lg leading-tight">{formatCurrency(hover.cell.revenue)}</div>
              <div className="text-ink-3 tabular font-mono">{formatCount(hover.cell.orders, 'order')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda de la escala */}
      <div className="text-ink-3 mt-4 flex items-center justify-end gap-1.5 font-mono text-[10px] uppercase">
        <span className="mr-1">Less</span>
        {LEVELS.map((color, i) => (
          <span key={i} className="size-3 rounded-[3px]" style={{ background: color }} />
        ))}
        <span className="ml-1">More</span>
      </div>
    </div>
  )
}
