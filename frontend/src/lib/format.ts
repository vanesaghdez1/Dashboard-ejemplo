const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })
const currencyCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'narrowSymbol',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const integer = new Intl.NumberFormat('en-US')
const monthShort = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const formatCurrency = (value: number) => currency.format(value)
export const formatCompactCurrency = (value: number) => currencyCompact.format(value)
export const formatNumber = (value: number) => integer.format(value)
export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

export const formatMonth = (year: number, month: number, long = false) => {
  const date = new Date(Date.UTC(year, month - 1, 1))
  if (long) return monthLong.format(date) // "June 2026"
  // "Jun 26" se confundiría con un día del mes: se escribe "Jun '26"
  const parts = monthShort.formatToParts(date)
  const m = parts.find((p) => p.type === 'month')?.value ?? ''
  const y = parts.find((p) => p.type === 'year')?.value ?? ''
  return `${m} '${y}`
}

/** ¿El mes indicado es el mes actual (todavía sin cerrar)? */
export const isCurrentMonth = (year: number, month: number) => {
  const now = new Date()
  return now.getFullYear() === year && now.getMonth() + 1 === month
}

/** Fecha local en formato yyyy-mm-dd (lo que espera DateOnly en .NET). */
export const toIsoDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const longDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' })
const dayMonth = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const dayFull = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const monthOnly = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

/** "jueves 20 de noviembre" (fecha de hoy en el encabezado). */
export const formatToday = (date = new Date()) => longDate.format(date)

/** yyyy-mm-dd → Date en UTC (evita que la zona horaria mueva el día). */
export const parseIsoDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
export const formatDayMonth = (iso: string) => dayMonth.format(parseIsoDate(iso))
export const formatDayFull = (iso: string) => {
  const text = dayFull.format(parseIsoDate(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}
export const formatMonthShort = (date: Date) => monthOnly.format(date).replace('.', '')

/** Variación relativa (0.123 = +12.3 %). Null si no hay base de comparación. */
export const relativeChange = (current: number, previous: number | undefined | null) =>
  previous ? (current - previous) / previous : null

export const formatSignedPercent = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value * 100).toFixed(1)}%`

/** Saludo según la hora local. */
export const greeting = (date = new Date()) => {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'
}

/** "1 order" / "12 orders": número + sustantivo en singular o plural (inglés). */
export const formatCount = (value: number, singular: string, plural = `${singular}s`) =>
  `${formatNumber(value)} ${value === 1 ? singular : plural}`
