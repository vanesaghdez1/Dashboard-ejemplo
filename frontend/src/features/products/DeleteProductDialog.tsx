import { AlertTriangle } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { ApiError } from '../../lib/api'
import type { Product } from '../../types/api'
import { useDeleteProduct } from './queries'

interface Props {
  product: Product | null
  onClose: () => void
  onDeleted: (message: string) => void
}

/** Confirmación antes de eliminar. Si el producto tiene ventas, la API responde 409 y se explica aquí. */
export function DeleteProductDialog({ product, onClose, onDeleted }: Props) {
  const deleteProduct = useDeleteProduct()

  function handleClose() {
    deleteProduct.reset()
    onClose()
  }

  async function handleDelete() {
    if (!product) return
    try {
      await deleteProduct.mutateAsync(product.id)
      onDeleted(`“${product.name}” se eliminó`)
      handleClose()
    } catch {
      /* el error se muestra abajo */
    }
  }

  const error = deleteProduct.error
  return (
    <Dialog open={product !== null} onClose={handleClose} title="Eliminar producto">
      <p className="text-ink-2 text-sm">
        ¿Seguro que quieres eliminar <strong className="text-ink">{product?.name}</strong> ({product?.sku})? Esta
        acción no se puede deshacer.
      </p>

      {error && (
        <div role="alert" className="border-warning/50 mt-4 flex gap-2 rounded-lg border p-3 text-sm">
          <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="text-ink font-medium">{error.message}</p>
            {error instanceof ApiError && error.detail && <p className="text-ink-3">{error.detail}</p>}
          </div>
        </div>
      )}

      <footer className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={handleClose} className="border-line text-ink hover:bg-surface-2 rounded-full border px-5 py-2 text-sm">
          {error ? 'Entendido' : 'Cancelar'}
        </button>
        {!error && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleteProduct.isPending}
            className="bg-critical rounded-full px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {deleteProduct.isPending ? 'Eliminando…' : 'Eliminar'}
          </button>
        )}
      </footer>
    </Dialog>
  )
}
