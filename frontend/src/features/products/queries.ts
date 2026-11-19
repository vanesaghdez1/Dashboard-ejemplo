import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPost, apiPut } from '../../lib/api'
import type { Category, PagedResult, Product, ProductDetail } from '../../types/api'
import type { ProductFormValues } from './productSchema'

export function useProducts(search: string, page: number, pageSize = 10) {
  return useQuery({
    queryKey: ['products', 'list', { search, page, pageSize }],
    queryFn: ({ signal }) =>
      apiGet<PagedResult<Product>>('/api/products', { search, page, pageSize }, signal),
    placeholderData: keepPreviousData,
  })
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: ({ signal }) => apiGet<ProductDetail>(`/api/products/${id}`, undefined, signal),
    enabled: id !== null, // solo se pide cuando se está editando
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => apiGet<Category[]>('/api/categories', undefined, signal),
    staleTime: Infinity,
  })
}

// ---------- Mutaciones (crear / editar / eliminar) ----------
// Después de cambiar datos, se "invalida" la caché: TanStack Query vuelve a pedir
// la lista de productos y el dashboard (el KPI de stock bajo puede cambiar).

function useInvalidateProducts() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['products'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: (values: ProductFormValues) => apiPost<ProductDetail>('/api/products', values),
    onSuccess: invalidate,
  })
}

export function useUpdateProduct(id: string) {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: ({ sku: _sku, ...values }: ProductFormValues) =>
      apiPut<ProductDetail>(`/api/products/${id}`, values), // el SKU no se manda: no se puede editar
    onSuccess: invalidate,
  })
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/products/${id}`),
    onSuccess: invalidate,
  })
}
