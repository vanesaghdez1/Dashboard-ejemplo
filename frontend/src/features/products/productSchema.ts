import { z } from 'zod'

/**
 * Validación del formulario en el navegador (respuesta inmediata al usuario).
 * Repite las reglas de ProductValidators.cs del backend, que es quien tiene la última palabra:
 * si alguien se salta esta validación, la API igual rechaza los datos.
 */
const numberField = (message: string) => z.number({ error: 'Enter a valid number.' }).min(0, message)

const priceField = z.number({ error: 'Enter a valid number.' }).gt(0, 'Price must be greater than 0.')
const costField = numberField('Cost cannot be negative.')
const priceAndCost = z.object({ price: priceField, cost: costField })

export const productSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(1, 'SKU is required.')
      .max(30, 'SKU cannot exceed 30 characters.')
      .regex(/^[A-Za-z0-9-]+$/, 'SKU can only contain letters, numbers, and hyphens.'),
    name: z.string().trim().min(1, 'Name is required.').max(200, 'Name cannot exceed 200 characters.'),
    categoryId: z.string().min(1, 'Select a category.'),
    price: priceField,
    cost: costField,
    stock: numberField('Stock cannot be negative.').int('Must be a whole number.'),
    minStock: numberField('Minimum stock cannot be negative.').int('Must be a whole number.'),
  })
  .refine((p) => p.price >= p.cost, {
    message: 'Price cannot be lower than cost.',
    path: ['price'],
    // Revisar esta regla en cuanto precio y costo sean válidos, aunque otros campos sigan vacíos
    when: (payload) => priceAndCost.safeParse(payload.value).success,
  })

export type ProductFormValues = z.infer<typeof productSchema>
