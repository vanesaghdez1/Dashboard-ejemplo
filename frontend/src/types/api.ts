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

export interface DashboardSummary {
  kpis: Kpis
  salesByMonth: MonthlySales[]
  topProducts: TopProduct[]
  salesByBranch: BranchSales[]
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
