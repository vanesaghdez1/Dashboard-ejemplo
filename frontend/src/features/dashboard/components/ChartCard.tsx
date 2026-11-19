import { useState, type ReactNode } from 'react'
import { BarChart3, Table2 } from 'lucide-react'

interface ChartCardProps {
  title: string
  subtitle?: string
  chart: ReactNode
  table: ReactNode
  className?: string
}

/**
 * Contenedor de gráfica con alternancia "gráfica / tabla".
 * La vista de tabla da acceso a los valores exactos (accesibilidad y lectores de pantalla).
 */
export function ChartCard({ title, subtitle, chart, table, className = '' }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <section className={`border-line bg-surface rounded-xl border p-4 ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-ink text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-ink-3 text-xs">{subtitle}</p>}
        </div>
        <div className="border-line flex rounded-md border p-0.5" role="group" aria-label="Vista">
          <ViewButton active={view === 'chart'} onClick={() => setView('chart')} label="Ver gráfica">
            <BarChart3 size={14} aria-hidden />
          </ViewButton>
          <ViewButton active={view === 'table'} onClick={() => setView('table')} label="Ver tabla">
            <Table2 size={14} aria-hidden />
          </ViewButton>
        </div>
      </header>
      {view === 'chart' ? chart : <div className="max-h-72 overflow-auto">{table}</div>}
    </section>
  )
}

function ViewButton(props: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={props.active}
      title={props.label}
      aria-label={props.label}
      className={`rounded px-2 py-1 ${props.active ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'}`}
    >
      {props.children}
    </button>
  )
}

/** Tabla simple y consistente para la vista "tabla" de cada gráfica. */
export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-ink-3 border-line border-b text-left text-xs">
          {headers.map((h, i) => (
            <th key={h} className={`py-2 font-medium ${i > 0 ? 'text-right' : ''}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-line border-b last:border-0">
            {row.map((cell, i) => (
              <td key={i} className={`text-ink py-2 ${i > 0 ? 'tabular text-right' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
