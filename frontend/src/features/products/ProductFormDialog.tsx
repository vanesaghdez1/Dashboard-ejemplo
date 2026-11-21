import { useEffect, type ReactNode } from 'react'
import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { ApiError } from '../../lib/api'
import { productSchema, type ProductFormValues } from './productSchema'
import { useCategories, useCreateProduct, useProduct, useUpdateProduct } from './queries'

/** null = cerrado · { mode: 'create' } = nuevo · { mode: 'edit', id } = editar */
export type ProductDialogState = null | { mode: 'create' } | { mode: 'edit'; id: string }

interface Props {
  state: ProductDialogState
  onClose: () => void
  onSaved: (message: string) => void
}

export function ProductFormDialog({ state, onClose, onSaved }: Props) {
  const isEdit = state?.mode === 'edit'
  return (
    <Dialog
      open={state !== null}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      description={isEdit ? 'El SKU no se puede cambiar.' : 'Completa los datos del producto.'}
    >
      {/* key: al cambiar de producto, el formulario se reinicia desde cero */}
      {state && <ProductForm key={state.mode === 'edit' ? state.id : 'new'} state={state} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  )
}

const EMPTY: Partial<ProductFormValues> = { sku: '', name: '', categoryId: '' }

function ProductForm({ state, onClose, onSaved }: { state: NonNullable<ProductDialogState> } & Omit<Props, 'state'>) {
  const editId = state.mode === 'edit' ? state.id : null
  const categories = useCategories()
  const product = useProduct(editId)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct(editId ?? '')

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({ resolver: zodResolver(productSchema), defaultValues: EMPTY })

  // Al editar: cuando llegan los datos del producto, se cargan en el formulario
  useEffect(() => {
    if (product.data) reset(product.data)
  }, [product.data, reset])

  async function onSubmit(values: ProductFormValues) {
    try {
      if (editId) {
        await updateProduct.mutateAsync(values)
        onSaved(`“${values.name}” se actualizó`)
      } else {
        await createProduct.mutateAsync(values)
        onSaved(`“${values.name}” se creó`)
      }
      onClose()
    } catch (e) {
      // Errores del backend: se muestran en el campo correspondiente (ej. SKU duplicado)
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          setError(field as FieldPath<ProductFormValues>, { message })
        }
      } else {
        setError('root', { message: e instanceof Error ? e.message : 'No se pudo guardar' })
      }
    }
  }

  if (editId && product.isPending) return <p className="text-ink-3 py-8 text-center text-sm">Cargando producto…</p>

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {errors.root && (
        <div role="alert" className="border-critical/40 flex items-center gap-2 rounded-lg border p-3 text-sm">
          <AlertCircle size={16} className="text-critical shrink-0" aria-hidden />
          {errors.root.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="SKU" error={errors.sku?.message}>
          <input
            {...register('sku')} aria-invalid={!!errors.sku}
            readOnly={!!editId}
            placeholder="Ej. ELEC-2001"
            className={`${inputClass} uppercase ${editId ? 'text-ink-3 cursor-not-allowed' : ''}`}
          />
        </Field>
        <Field label="Categoría" error={errors.categoryId?.message}>
          <select {...register('categoryId')} aria-invalid={!!errors.categoryId} className={inputClass}>
            <option value="">Selecciona…</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Nombre" error={errors.name?.message}>
        <input {...register('name')} aria-invalid={!!errors.name} placeholder="Ej. Teclado inalámbrico" className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Precio de venta (MXN)" error={errors.price?.message}>
          <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} aria-invalid={!!errors.price} className={inputClass} />
        </Field>
        <Field label="Costo (MXN)" error={errors.cost?.message}>
          <input type="number" step="0.01" {...register('cost', { valueAsNumber: true })} aria-invalid={!!errors.cost} className={inputClass} />
        </Field>
        <Field label="Stock actual" error={errors.stock?.message}>
          <input type="number" step="1" {...register('stock', { valueAsNumber: true })} aria-invalid={!!errors.stock} className={inputClass} />
        </Field>
        <Field label="Stock mínimo" error={errors.minStock?.message}>
          <input type="number" step="1" {...register('minStock', { valueAsNumber: true })} aria-invalid={!!errors.minStock} className={inputClass} />
        </Field>
      </div>

      <footer className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="border-line text-ink hover:bg-surface-2 rounded-full border px-5 py-2 text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent text-on-accent rounded-full px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </footer>
    </form>
  )
}

const inputClass = 'border-line bg-bg text-ink w-full rounded-xl border px-3 py-2.5 text-sm focus:border-accent outline-none aria-[invalid=true]:border-critical'

/** Etiqueta + input + mensaje de error, conectados para lectores de pantalla. */
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink-2">{label}</span>
      {children}
      {error && (
        <span role="alert" className="text-critical text-xs">
          {error}
        </span>
      )}
    </label>
  )
}
