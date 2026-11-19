import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}

/**
 * Ventana modal basada en el elemento nativo <dialog>: el navegador ya resuelve
 * el foco, la tecla Esc y el fondo oscuro (accesible sin librerías extra).
 */
export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="dialog-title"
      className="border-line bg-surface text-ink m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border p-0 shadow-2xl backdrop:bg-black/50"
    >
      {open && (
        <div className="p-6">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
              {description && <p className="text-ink-2 mt-1 text-sm">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="text-ink-3 hover:bg-surface-2 hover:text-ink rounded-md p-1"
            >
              <X size={18} aria-hidden />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
