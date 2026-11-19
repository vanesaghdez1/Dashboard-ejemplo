import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

/** Aviso breve de confirmación ("Producto creado"). Se anuncia a lectores de pantalla. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDone, 3500)
    return () => clearTimeout(id)
  }, [message, onDone])

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50">
      {message && (
        <div className="border-line bg-surface text-ink flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg">
          <CheckCircle2 size={16} className="text-good" aria-hidden />
          {message}
        </div>
      )}
    </div>
  )
}
