import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import type { Branch, DashboardFilter, DashboardSummary } from '../../types/api'

// TanStack Query: cada queryKey identifica una respuesta en caché.
// Si el filtro cambia, la key cambia y se hace una nueva petición; si vuelves a un
// filtro anterior, se muestra al instante desde caché.

export function useDashboardSummary(filter: DashboardFilter) {
  return useQuery({
    queryKey: ['dashboard', 'summary', filter],
    queryFn: ({ signal }) => apiGet<DashboardSummary>('/api/dashboard/summary', { ...filter }, signal),
    placeholderData: keepPreviousData, // mantiene los datos previos mientras carga el nuevo filtro
  })
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: ({ signal }) => apiGet<Branch[]>('/api/branches', undefined, signal),
    staleTime: Infinity, // catálogo que casi no cambia
  })
}
