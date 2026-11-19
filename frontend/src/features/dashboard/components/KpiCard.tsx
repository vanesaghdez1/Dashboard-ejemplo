import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: string
  hint?: ReactNode
  icon?: ReactNode
}

/** Tarjeta de indicador: una cifra protagonista con su etiqueta. */
export function KpiCard({ label, value, hint, icon }: KpiCardProps) {
  return (
    <div className="border-line bg-surface rounded-xl border p-4">
      <div className="text-ink-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <div className="text-ink tabular mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{value}</div>
      {hint && <div className="text-ink-3 mt-1 text-xs">{hint}</div>}
    </div>
  )
}
