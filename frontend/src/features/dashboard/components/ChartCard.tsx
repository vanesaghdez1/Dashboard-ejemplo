import { useState, type CSSProperties, type ReactNode } from 'react'

interface ChartCardProps {
  /** Número de sección estilo editorial ("02"). */
  index?: string
  title: string
  subtitle?: ReactNode
  chart: ReactNode
  table: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Sección con gráfica y alternancia "gráfica / tabla".
 * La vista de tabla da acceso a los valores exactos (accesibilidad y lectores de pantalla).
 */
export function ChartCard({ index, title, subtitle, chart, table, className = '', style }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <section
      className={`border-line bg-surface shadow-card rise rounded-[20px] border p-5 md:p-6 ${className}`}
      style={style}
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {index && <p className="eyebrow mb-1">{index}</p>}
          <h2 className="text-ink font-serif text-[28px] leading-none tracking-tight">{title}</h2>
          {subtitle && <p className="text-ink-3 mt-2 text-sm">{subtitle}</p>}
        </div>
        <ViewToggle view={view} onChange={setView} />
      </header>
      {view === 'chart' ? chart : <div className="max-h-80 overflow-auto">{table}</div>}
    </section>
  )
}

/** Interruptor "Gráfica | Tabla" en texto (más claro que dos íconos). */
export function ViewToggle({ view, onChange }: { view: 'chart' | 'table'; onChange: (v: 'chart' | 'table') => void }) {
  return (
    <div className="bg-surface-2 flex shrink-0 rounded-full p-0.5 font-mono text-[11px]" role="group" aria-label="Vista">
      {(['chart', 'table'] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => onChange(v)}
          className={`rounded-full px-3 py-1 tracking-wide uppercase transition-colors ${
            view === v ? 'bg-surface text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
          }`}
        >
          {v === 'chart' ? 'Gráfica' : 'Tabla'}
        </button>
      ))}
    </div>
  )
}

/** Tabla simple y consistente para la vista "tabla" de cada gráfica. */
export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-line border-b text-left">
          {headers.map((h, i) => (
            <th key={h} className={`eyebrow py-2.5 font-normal ${i > 0 ? 'text-right' : ''}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-line border-b border-dashed last:border-0">
            {row.map((cell, i) => (
              <td key={i} className={`text-ink py-2.5 ${i > 0 ? 'tabular text-right font-mono text-[13px]' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
