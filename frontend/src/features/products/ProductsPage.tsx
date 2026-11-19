import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useProducts } from './queries'
import { formatCurrency, formatNumber } from '../../lib/format'
import { QueryError } from '../../components/QueryError'

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
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const products = useProducts(debouncedSearch, page)
  const data = products.data

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-semibold tracking-tight">Productos</h1>
          <p className="text-ink-2 text-sm">Catálogo e inventario</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="text-ink-3 absolute top-1/2 left-3 -translate-y-1/2" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // nueva búsqueda → volver a la primera página
            }}
            placeholder="Buscar por nombre o SKU"
            aria-label="Buscar productos"
            className="border-line bg-surface text-ink placeholder:text-ink-3 w-full rounded-lg border py-2 pr-3 pl-9 text-sm"
          />
        </div>
      </header>

      {products.isError && <QueryError error={products.error} onRetry={() => products.refetch()} />}

      <div className="border-line bg-surface overflow-x-auto rounded-xl border">
        <table className={`w-full min-w-[720px] text-sm ${products.isPlaceholderData ? 'opacity-60' : ''}`}>
          <thead>
            <tr className="text-ink-3 border-line border-b text-left text-xs">
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 text-right font-medium">Precio</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.id} className="border-line hover:bg-surface-2 border-b last:border-0">
                <td className="text-ink-3 px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="text-ink px-4 py-3 font-medium">{p.name}</td>
                <td className="text-ink-2 px-4 py-3">{p.category}</td>
                <td className="text-ink tabular px-4 py-3 text-right">{formatCurrency(p.price)}</td>
                <td className="text-ink tabular px-4 py-3 text-right">
                  {formatNumber(p.stock)} <span className="text-ink-3">/ mín. {p.minStock}</span>
                </td>
                <td className="px-4 py-3">
                  {/* Estado con ícono + texto: nunca solo color */}
                  {p.isLowStock ? (
                    <span className="text-ink inline-flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-warning" aria-hidden /> Resurtir
                    </span>
                  ) : (
                    <span className="text-ink-2 inline-flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-good" aria-hidden /> Disponible
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="text-ink-3 px-4 py-10 text-center">
                  No hay productos que coincidan con “{debouncedSearch}”.
                </td>
              </tr>
            )}
            {!data && products.isPending && (
              <tr>
                <td colSpan={6} className="text-ink-3 px-4 py-10 text-center">
                  Cargando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <nav className="text-ink-2 flex items-center justify-between text-sm" aria-label="Paginación">
          <span className="tabular">
            {formatNumber(data.totalCount)} productos · página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <PageButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)} label="Página anterior">
              <ChevronLeft size={16} aria-hidden />
            </PageButton>
            <PageButton disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} label="Página siguiente">
              <ChevronRight size={16} aria-hidden />
            </PageButton>
          </div>
        </nav>
      )}
    </div>
  )
}

function PageButton(props: { disabled: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      aria-label={props.label}
      className="border-line bg-surface text-ink hover:bg-surface-2 rounded-md border p-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {props.children}
    </button>
  )
}
