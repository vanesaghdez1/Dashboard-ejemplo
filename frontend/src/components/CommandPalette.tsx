import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CornerDownLeft, Package, Search } from 'lucide-react'
import { apiGet } from '../lib/api'
import { formatCurrency } from '../lib/format'
import type { PagedResult, Product } from '../types/api'

export interface PaletteAction {
  id: string
  label: string
  hint?: string
  icon: ReactNode
  group: string
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  actions: PaletteAction[]
  onProductSelected: (product: Product) => void
}

/**
 * Paleta de comandos (Ctrl/⌘ + K): navegar, cambiar tema o buscar productos sin usar el mouse.
 * Basada en <dialog> nativo; flechas para moverse, Enter para ejecutar, Esc para cerrar.
 */
export function CommandPalette({ open, onClose, actions, onProductSelected }: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setQuery('')
      setActive(0)
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const term = query.trim()
  const products = useQuery({
    queryKey: ['palette-products', term],
    queryFn: ({ signal }) =>
      apiGet<PagedResult<Product>>('/api/products', { search: term, page: 1, pageSize: 5 }, signal),
    enabled: open && term.length >= 2,
    staleTime: 30_000,
  })

  // Lista plana de resultados: acciones que coinciden + productos encontrados
  const items = useMemo<PaletteAction[]>(() => {
    const normalized = normalize(term)
    const matched = actions.filter((a) => !normalized || normalize(a.label).includes(normalized))
    const found = (term.length >= 2 ? (products.data?.items ?? []) : []).map<PaletteAction>((p) => ({
      id: `product-${p.id}`,
      label: p.name,
      hint: `${p.sku} · ${formatCurrency(p.price)}`,
      icon: <Package size={16} aria-hidden />,
      group: 'Products',
      run: () => onProductSelected(p),
    }))
    return [...matched, ...found]
  }, [actions, products.data, term, onProductSelected])

  const safeActive = Math.min(active, Math.max(items.length - 1, 0))

  function execute(item: PaletteAction | undefined) {
    if (!item) return
    onClose()
    item.run()
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (items.length ? (Math.min(i, items.length - 1) + 1) % items.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (items.length ? (Math.min(i, items.length - 1) - 1 + items.length) % items.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      execute(items[safeActive])
    }
  }

  let lastGroup = ''

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()} // clic fuera = cerrar
      aria-label="Command palette"
      className="bg-surface text-ink border-line shadow-card mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border p-0 [&[open]]:animate-[pop_.18s_ease-out]"
    >
      {open && (
        <div onKeyDown={handleKeyDown}>
          <div className="border-line flex items-center gap-3 border-b px-4">
            <Search size={18} className="text-ink-3 shrink-0" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              placeholder="Search products or type a command…"
              aria-label="Search"
              aria-controls="palette-results"
              aria-activedescendant={items[safeActive]?.id}
              role="combobox"
              aria-expanded="true"
              className="placeholder:text-ink-3 h-14 w-full bg-transparent text-base outline-none focus-visible:outline-none"
            />
            <kbd className="eyebrow border-line rounded border px-1.5 py-0.5 !text-[10px]">Esc</kbd>
          </div>

          <ul id="palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {items.map((item, index) => {
              const showGroup = item.group !== lastGroup
              lastGroup = item.group
              const selected = index === safeActive
              return (
                <li key={item.id} role="presentation">
                  {showGroup && <div className="eyebrow px-3 pt-3 pb-1.5">{item.group}</div>}
                  <div
                    id={item.id}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActive(index)}
                    onClick={() => execute(item)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      selected ? 'bg-accent text-on-accent' : 'text-ink'
                    }`}
                  >
                    <span className={selected ? '' : 'text-ink-3'}>{item.icon}</span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hint && (
                      <span className={`font-mono text-xs ${selected ? 'opacity-80' : 'text-ink-3'}`}>{item.hint}</span>
                    )}
                    {selected && <CornerDownLeft size={14} aria-hidden />}
                  </div>
                </li>
              )
            })}
            {items.length === 0 && (
              <li className="text-ink-3 px-3 py-8 text-center text-sm">
                {products.isFetching ? 'Searching…' : `No results for “${term}”`}
              </li>
            )}
          </ul>

          <footer className="border-line text-ink-3 flex gap-4 border-t px-4 py-2.5 font-mono text-[11px]">
            <span>↑↓ navigate</span>
            <span>↵ open</span>
            <span className="ml-auto">Type 2+ letters to search products</span>
          </footer>
        </div>
      )}
    </dialog>
  )
}

/** Comparación sin acentos ni mayúsculas ("Catalogo" encuentra "Catálogo"). */
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
