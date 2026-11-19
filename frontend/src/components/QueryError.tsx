import { AlertCircle } from 'lucide-react'

/** Mensaje de error reutilizable para cualquier petición fallida. */
export function QueryError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div role="alert" className="border-critical/40 bg-surface flex items-center gap-3 rounded-xl border p-4 text-sm">
      <AlertCircle size={18} className="text-critical shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="text-ink font-medium">No se pudieron cargar los datos</p>
        <p className="text-ink-3">{error.message}. ¿Está corriendo la API en el puerto 5080?</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="border-line text-ink hover:bg-surface-2 rounded-md border px-3 py-1.5"
      >
        Reintentar
      </button>
    </div>
  )
}
