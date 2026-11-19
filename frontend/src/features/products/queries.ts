import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiGet } from '../../lib/api'
import type { PagedResult, Product } from '../../types/api'

export function useProducts(search: string, page: number, pageSize = 10) {
  return useQuery({
    queryKey: ['products', { search, page, pageSize }],
    queryFn: ({ signal }) =>
      apiGet<PagedResult<Product>>('/api/products', { search, page, pageSize }, signal),
    placeholderData: keepPreviousData,
  })
}
