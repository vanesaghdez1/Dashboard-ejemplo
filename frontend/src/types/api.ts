// Tipos que reflejan los DTOs del backend (Dashboard.Application).
// Si cambias un record en C#, actualiza aquí su espejo.

export interface Kpis {
  revenue: number
  orders: number
  averageTicket: number
  grossMargin: number
  lowStockProducts: number
}

export interface MonthlySales {
  year: number
  month: number
  revenue: number
  orders: number
}

export interface TopProduct {
  productId: string
  name: string
  units: number
  revenue: number
}

export interface BranchSales {
  branchId: string
  branch: string
  revenue: number
  orders: number
}

export interface DailySales {
  date: string // yyyy-mm-dd
  revenue: number
  orders: number
}

/** Totales del periodo anterior de igual duración (null si no aplica, p. ej. "Todo"). */
export interface PeriodComparison {
  from: string
  to: string
  revenue: number
  orders: number
  averageTicket: number
  grossMargin: number
}

export interface DashboardSummary {
  kpis: Kpis
  salesByMonth: MonthlySales[]
  topProducts: TopProduct[]
  salesByBranch: BranchSales[]
  salesByDay: DailySales[]
  previous: PeriodComparison | null
}

export interface DashboardFilter {
  from?: string // yyyy-mm-dd
  to?: string
  branchId?: string
}

export interface Branch {
  id: string
  name: string
  city: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  isLowStock: boolean
}

export interface ProductDetail {
  id: string
  sku: string
  name: string
  categoryId: string
  price: number
  cost: number
  stock: number
  minStock: number
}

export interface Category {
  id: string
  name: string
}

// ---------- Autenticación ----------

export type UserRole = 'Admin' | 'Manager' | 'Seller'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  branchId: string | null
  branchName: string | null
}

export interface AuthResponse {
  accessToken: string
  expiresAt: string
  user: User
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
