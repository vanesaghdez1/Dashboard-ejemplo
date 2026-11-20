import type { ReactNode } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import type { Branch } from '../../../types/api'

export type RangePreset = '30d' | '3m' | '6m' | '12m' | 'all'

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: '30d', label: '30D' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
  { value: 'all', label: 'Todo' },
]

interface FiltersProps {
  range: RangePreset
  onRangeChange: (range: RangePreset) => void
  branchId: string
  onBranchChange: (branchId: string) => void
  branches: Branch[]
  /** Si viene, el usuario está limitado a esta sucursal (Gerente): se muestra fija, sin selector. */
  lockedBranchName?: string | null
  /** Botones extra al final de la barra (p. ej. Exportar). */
  actions?: ReactNode
}

/** Barra de filtros en una sola fila, arriba de las gráficas. */
export function Filters({ range, onRangeChange, branchId, onBranchChange, branches, lockedBranchName, actions }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="border-line bg-surface flex rounded-full border p-1" role="group" aria-label="Periodo">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={range === opt.value}
            onClick={() => onRangeChange(opt.value)}
            className={`rounded-full px-3 py-1.5 font-mono text-xs tracking-wide transition-colors ${
              range === opt.value ? 'bg-ink text-bg' : 'text-ink-2 hover:text-ink hover:bg-surface-2'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {lockedBranchName ? (
        <span className="border-line bg-surface text-ink flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
          <MapPin size={14} className="text-accent" aria-hidden />
          {lockedBranchName}
          <span className="sr-only">(sucursal asignada)</span>
        </span>
      ) : (
        <BranchSelect branchId={branchId} onBranchChange={onBranchChange} branches={branches} />
      )}
      {actions}
    </div>
  )
}

function BranchSelect({ branchId, onBranchChange, branches }: Pick<FiltersProps, 'branchId' | 'onBranchChange' | 'branches'>) {
  return (
    <div className="relative">
      <label className="sr-only" htmlFor="branch-filter">
        Sucursal
      </label>
      <MapPin size={14} className="text-accent pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" aria-hidden />
      <select
        id="branch-filter"
        value={branchId}
        onChange={(e) => onBranchChange(e.target.value)}
        className="border-line bg-surface text-ink hover:bg-surface-2 cursor-pointer appearance-none rounded-full border py-2 pr-9 pl-9 text-sm transition-colors"
      >
        <option value="">Todas las sucursales</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="text-ink-3 pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2" aria-hidden />
    </div>
  )
}
