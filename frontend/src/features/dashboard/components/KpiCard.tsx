import { useId, type CSSProperties, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatSignedPercent } from '../../../lib/format'
import { useCountUp } from '../../../lib/useCountUp'

/**
 * Variación contra el periodo anterior. Flecha + texto (nunca solo color),
 * verde si mejora y rojo si empeora.
 */
export function DeltaBadge({ change, compact = false }: { change: number | null; compact?: boolean }) {
  if (change === null || !Number.isFinite(change)) return null
  const up = change >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-mono font-medium tabular ${
        up ? 'text-good' : 'text-critical'
      } ${compact ? 'text-xs' : 'bg-surface-2 px-2 py-0.5 text-xs'}`}
    >
      <Icon size={14} aria-hidden />
      {formatSignedPercent(change)}
      <span className="sr-only"> vs. previous period</span>
    </span>
  )
}

/** Mini gráfica de tendencia (sin ejes): una línea de 2px y un punto en el último valor. */
export function Sparkline({ values, label, className = '' }: { values: number[]; label: string; className?: string }) {
  const gradientId = useId()
  if (values.length < 2) return null

  const w = 120
  const h = 40
  const pad = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - pad * 2),
    pad + (1 - (v - min) / span) * (h - pad * 2),
  ])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${points.at(-1)![0]},${h} L${points[0][0]},${h} Z`
  const [lx, ly] = points.at(-1)!

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-10 w-28 overflow-visible ${className}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1}
        style={{ animation: 'draw 1.1s .2s cubic-bezier(.2,.7,.2,1) forwards' }}
      />
      <circle cx={lx} cy={ly} r="3.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  )
}

interface KpiTileProps {
  label: string
  value: number
  format: (value: number) => string
  change?: number | null
  aside?: ReactNode
  footer?: ReactNode
  className?: string
  style?: CSSProperties
}

/** Indicador: etiqueta editorial, cifra grande en serif que "cuenta" hasta su valor, variación y extra. */
export function KpiTile({ label, value, format, change = null, aside, footer, className = '', style }: KpiTileProps) {
  const animated = useCountUp(value)
  return (
    <div
      className={`border-line bg-surface shadow-card rise flex items-center gap-4 rounded-[20px] border p-5 ${className}`}
      style={style}
    >
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{label}</p>
        <p className="text-ink tabular mt-1.5 font-serif text-4xl leading-none tracking-tight">
          <span className="sr-only">{format(value)}</span>
          <span aria-hidden>{format(animated)}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <DeltaBadge change={change} compact />
          {footer}
        </div>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  )
}
