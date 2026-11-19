const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const currencyCompact = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const integer = new Intl.NumberFormat('es-MX')
const monthShort = new Intl.DateTimeFormat('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const monthLong = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const formatCurrency = (value: number) => currency.format(value)
export const formatCompactCurrency = (value: number) => currencyCompact.format(value)
export const formatNumber = (value: number) => integer.format(value)
export const formatPercent = (value: number) => `${(value * 100).toFixed(1)} %`

export const formatMonth = (year: number, month: number, long = false) => {
  const text = (long ? monthLong : monthShort).format(new Date(Date.UTC(year, month - 1, 1)))
  return text.charAt(0).toUpperCase() + text.slice(1) // "junio de 2026" → "Junio de 2026"
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
