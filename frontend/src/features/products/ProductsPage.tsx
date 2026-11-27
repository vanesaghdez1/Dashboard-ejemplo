import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useProducts } from './queries'
import { ProductFormDialog, type ProductDialogState } from './ProductFormDialog'
import { DeleteProductDialog } from './DeleteProductDialog'
import { formatCount, formatCurrency, formatNumber } from '../../lib/format'
import { QueryError } from '../../components/QueryError'
import { ExportButton } from '../../components/ExportButton'
import { Toast } from '../../components/Toast'
import { useAuth } from '../auth/auth-context'
import type { Product } from '../../types/api'

/** Espera a que el usuario deje de escribir antes de buscar (evita una petición por tecla). */
function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

export function ProductsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin' // la API también lo exige (403 si no)

  // ?q=SKU llega desde la paleta de comandos (Ctrl+K)
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(urlQuery)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  // Si la URL cambia estando ya en esta página, sincronizar la búsqueda
  const [lastUrlQuery, setLastUrlQuery] = useState(urlQuery)
  if (urlQuery !== lastUrlQuery) {
    setLastUrlQuery(urlQuery)
    setSearch(urlQuery)
    setPage(1)
  }

  const [formState, setFormState] = useState<ProductDialogState>(null)
  const [toDelete, setToDelete] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  const products = useProducts(debouncedSearch, page)
  const data = products.data
  const columns = isAdmin ? 7 : 6

  return (
    <div className="flex flex-col gap-8">
      <header className="rise flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow">Inventory · {data ? formatCount(data.totalCount, 'product') : '…'}</p>
          <h1 className="text-ink mt-3 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Catalog<span className="text-accent">.</span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="text-ink-3 absolute top-1/2 left-3 -translate-y-1/2" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1) // nueva búsqueda → volver a la primera página
              }}
              placeholder="Search by name or SKU"
              aria-label="Search products"
              className="border-line bg-surface text-ink placeholder:text-ink-3 w-full rounded-full border py-2 pr-4 pl-9 text-sm"
            />
          </div>
          <ExportButton path="/api/products/export" params={{ search: debouncedSearch }} />
          {isAdmin && (
            <button
              type="button"
              onClick={() => setFormState({ mode: 'create' })}
              className="bg-accent text-on-accent flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            >
              <Plus size={16} aria-hidden /> New product
            </button>
          )}
        </div>
      </header>

      {products.isError && <QueryError error={products.error} onRetry={() => products.refetch()} />}

      <div className="border-line bg-surface shadow-card rise overflow-x-auto rounded-[20px] border" style={{ animationDelay: '80ms' }}>
        <table className={`w-full min-w-[760px] text-sm ${products.isPlaceholderData ? 'opacity-60' : ''}`}>
          <thead>
            <tr className="border-line border-b text-left [&>th]:eyebrow [&>th]:font-normal">
              <th className="px-5 py-4">SKU</th>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4 text-right">Price</th>
              <th className="px-5 py-4">Stock</th>
              <th className="px-5 py-4">Status</th>
              {isAdmin && (
                <th className="px-5 py-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className="border-line hover:bg-surface-2/60 border-b border-dashed transition-colors last:border-0">
                <td className="text-ink-3 px-5 py-3.5 font-mono text-xs">{p.sku}</td>
                <td className="text-ink px-5 py-3.5 font-medium">{p.name}</td>
                <td className="px-5 py-3.5"><span className="bg-surface-2 text-ink-2 rounded-full px-2.5 py-1 text-xs">{p.category}</span></td>
                <td className="text-ink tabular px-5 py-3.5 text-right font-mono text-[13px]">{formatCurrency(p.price)}</td>
                <td className="px-5 py-3.5">
                  <StockMeter stock={p.stock} minStock={p.minStock} low={p.isLowStock} />
                </td>
                <td className="px-5 py-3.5">
                  {/* Estado con ícono + texto: nunca solo color */}
                  {p.isLowStock ? (
                    <span className="text-ink inline-flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-warning" aria-hidden /> Reorder
                    </span>
                  ) : (
                    <span className="text-ink-2 inline-flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-good" aria-hidden /> In stock
                    </span>
                  )}
                </td>
                {isAdmin && (
                  <td className="px-5 py-2 text-right whitespace-nowrap">
                    <IconButton label={`Edit ${p.name}`} onClick={() => setFormState({ mode: 'edit', id: p.id })}>
                      <Pencil size={15} aria-hidden />
                    </IconButton>
                    <IconButton label={`Delete ${p.name}`} onClick={() => setToDelete(p)} danger>
                      <Trash2 size={15} aria-hidden />
                    </IconButton>
                  </td>
                )}
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={columns} className="text-ink-3 px-5 py-12 text-center">
                  No products match “{debouncedSearch}”.
                </td>
              </tr>
            )}
            {!data && products.isPending && (
              <tr>
                <td colSpan={columns} className="text-ink-3 px-5 py-12 text-center">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <nav className="text-ink-2 flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="tabular font-mono text-xs">
            {formatCount(data.totalCount, 'product')} · page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <PageButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)} label="Previous page">
              <ChevronLeft size={16} aria-hidden />
            </PageButton>
            <PageButton disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} label="Next page">
              <ChevronRight size={16} aria-hidden />
            </PageButton>
          </div>
        </nav>
      )}

      <ProductFormDialog state={formState} onClose={() => setFormState(null)} onSaved={setToast} />
      <DeleteProductDialog product={toDelete} onClose={() => setToDelete(null)} onDeleted={setToast} />
      <Toast message={toast} onDone={clearToast} />
    </div>
  )
}

function IconButton(props: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.label}
      title={props.label}
      className={`text-ink-3 rounded-full p-2 ${props.danger ? 'hover:text-critical' : 'hover:text-ink'} hover:bg-bg`}
    >
      {props.children}
    </button>
  )
}

function PageButton(props: { disabled: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      aria-label={props.label}
      className="border-line bg-surface text-ink hover:bg-surface-2 rounded-full border p-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {props.children}
    </button>
  )
}

/** Stock con barra: la marca vertical es el mínimo; por debajo, la barra pasa a color de alerta. */
function StockMeter({ stock, minStock, low }: { stock: number; minStock: number; low: boolean }) {
  const scale = Math.max(minStock * 3, stock, 1)
  return (
    <div className="flex items-center gap-3">
      <span className="text-ink tabular w-10 text-right font-mono text-[13px]">{formatNumber(stock)}</span>
      <span className="bg-surface-2 relative h-1.5 w-24 rounded-full" title={`Minimum: ${minStock}`}>
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${low ? 'bg-warning' : 'bg-accent'}`}
          style={{ width: `${(stock / scale) * 100}%` }}
        />
        <span className="bg-ink-3 absolute -top-1 h-3.5 w-px" style={{ left: `${(minStock / scale) * 100}%` }} />
      </span>
      <span className="text-ink-3 sr-only">minimum {minStock}</span>
    </div>
  )
}
