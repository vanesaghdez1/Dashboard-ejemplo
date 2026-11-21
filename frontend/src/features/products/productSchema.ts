import { z } from 'zod'

/**
 * Validación del formulario en el navegador (respuesta inmediata al usuario).
 * Repite las reglas de ProductValidators.cs del backend, que es quien tiene la última palabra:
 * si alguien se salta esta validación, la API igual rechaza los datos.
 */
const numberField = (message: string) => z.number({ error: 'Ingresa un número válido.' }).min(0, message)

const priceField = z.number({ error: 'Ingresa un número válido.' }).gt(0, 'El precio debe ser mayor a 0.')
const costField = numberField('El costo no puede ser negativo.')
const priceAndCost = z.object({ price: priceField, cost: costField })

export const productSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, 'El SKU es obligatorio.')
      .max(30, 'El SKU no puede tener más de 30 caracteres.')
      .regex(/^[A-Za-z0-9-]+$/, 'El SKU solo puede tener letras, números y guiones.'),
    name: z.string().trim().min(1, 'El nombre es obligatorio.').max(200, 'Máximo 200 caracteres.'),
    categoryId: z.string().min(1, 'Selecciona una categoría.'),
    price: priceField,
    cost: costField,
    stock: numberField('El stock no puede ser negativo.').int('Debe ser un número entero.'),
    minStock: numberField('El stock mínimo no puede ser negativo.').int('Debe ser un número entero.'),
  })
  .refine((p) => p.price >= p.cost, {
    message: 'El precio no puede ser menor que el costo.',
    path: ['price'],
    // Revisar esta regla en cuanto precio y costo sean válidos, aunque otros campos sigan vacíos
    when: (payload) => priceAndCost.safeParse(payload.value).success,
  })

export type ProductFormValues = z.infer<typeof productSchema>
