import { useState } from 'react'
import { Download } from 'lucide-react'
import { apiDownload } from '../lib/api'

type Params = Record<string, string | number | undefined | null>

/** Botón que descarga un Excel desde la API (con estado "Exportando…" y manejo de error). */
export function ExportButton({ path, params, label = 'Exportar Excel' }: { path: string; params?: Params; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setBusy(true)
    setError(null)
    try {
      await apiDownload(path, params)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo exportar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={busy}
        className="bg-ink text-bg flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        <Download size={15} aria-hidden />
        {busy ? 'Exportando…' : label}
      </button>
      {error && (
        <span role="alert" className="text-critical mt-1 text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
