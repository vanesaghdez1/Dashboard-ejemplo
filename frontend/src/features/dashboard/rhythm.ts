import type { DailySales } from '../../types/api'
import { parseIsoDate } from '../../lib/format'

// Cálculos del "ritmo diario" (mapa de calor). Funciones puras: fáciles de probar con Vitest.

const DAY_MS = 86_400_000
export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const WEEKDAY_PLURAL = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

export interface Cell {
  iso: string
  revenue: number
  orders: number
  col: number
  row: number // 0 = lunes
  level: number
}

/** Lunes = 0 … domingo = 6 */
export const weekdayIndex = (d: Date) => (d.getUTCDay() + 6) % 7

/** Arma la cuadrícula semana × día, incluyendo los días sin ventas. */
export function buildCells(days: DailySales[], from?: string, to?: string) {
  if (days.length === 0) return { cells: [] as Cell[], weeks: 0 }
  const start = parseIsoDate(from ?? days[0].date)
  const end = parseIsoDate(to ?? days.at(-1)!.date)
  const byDate = new Map(days.map((d) => [d.date, d]))

  // Umbrales por quintiles de los días con ventas → 5 niveles de intensidad
  const sorted = days.map((d) => d.revenue).filter((v) => v > 0).sort((a, b) => a - b)
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
  const thresholds = [0.2, 0.4, 0.6, 0.8].map(q)

  const firstMonday = new Date(start.getTime() - weekdayIndex(start) * DAY_MS)
  const cells: Cell[] = []
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const date = new Date(t)
    const iso = date.toISOString().slice(0, 10)
    const day = byDate.get(iso)
    const revenue = day?.revenue ?? 0
    cells.push({
      iso,
      revenue,
      orders: day?.orders ?? 0,
      col: Math.floor((t - firstMonday.getTime()) / (7 * DAY_MS)),
      row: weekdayIndex(date),
      level: revenue <= 0 ? 0 : 1 + thresholds.filter((th) => revenue > th).length,
    })
  }
  return { cells, weeks: (cells.at(-1)?.col ?? 0) + 1 }
}

/** Promedio diario por día de la semana (incluye días sin ventas en el rango). */
export function weekdayStats(days: DailySales[], from?: string, to?: string) {
  const { cells } = buildCells(days, from, to)
  const acc = WEEKDAY_NAMES.map(() => ({ revenue: 0, orders: 0, count: 0 }))
  for (const c of cells) {
    acc[c.row].revenue += c.revenue
    acc[c.row].orders += c.orders
    acc[c.row].count += 1
  }
  const stats = acc.map((a, i) => ({
    weekday: i,
    avgRevenue: a.count ? a.revenue / a.count : 0,
    avgOrders: a.count ? a.orders / a.count : 0,
  }))
  const dailyAvg = cells.length ? cells.reduce((s, c) => s + c.revenue, 0) / cells.length : 0
  const best = stats.reduce((a, b) => (b.avgRevenue > a.avgRevenue ? b : a), stats[0])
  return { stats, dailyAvg, best, uplift: dailyAvg ? best.avgRevenue / dailyAvg - 1 : 0 }
}

