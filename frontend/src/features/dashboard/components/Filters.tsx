import type { Branch } from '../../../types/api'

export type RangePreset = '30d' | '3m' | '6m' | '12m' | 'all'

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: '30d', label: '30 días' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
  { value: 'all', label: 'Todo' },
]

interface FiltersProps {
  range: RangePreset
  onRangeChange: (range: RangePreset) => void
  branchId: string
  onBranchChange: (branchId: string) => void
  branches: Branch[]
}

/** Barra de filtros en una sola fila, arriba de las gráficas. */
export function Filters({ range, onRangeChange, branchId, onBranchChange, branches }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="border-line bg-surface flex rounded-lg border p-0.5" role="group" aria-label="Periodo">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={range === opt.value}
            onClick={() => onRangeChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              range === opt.value ? 'bg-surface-2 text-ink font-medium' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label className="sr-only" htmlFor="branch-filter">
        Sucursal
      </label>
      <select
        id="branch-filter"
        value={branchId}
        onChange={(e) => onBranchChange(e.target.value)}
        className="border-line bg-surface text-ink rounded-lg border px-3 py-2 text-sm"
      >
        <option value="">Todas las sucursales</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  )
}
