// Cliente HTTP mínimo. Todas las llamadas a la API .NET pasan por aquí,
// así la URL base, los headers (y más adelante el token JWT) se configuran en un solo lugar.

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5080'

type QueryParams = Record<string, string | number | undefined | null>

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiGet<T>(path: string, params?: QueryParams, signal?: AbortSignal): Promise<T> {
  const url = new URL(path, API_URL)

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal })

  if (!response.ok) {
    // ASP.NET devuelve errores como ProblemDetails ({ title, detail, status })
    const problem = await response.json().catch(() => null)
    throw new ApiError(response.status, problem?.title ?? `Error ${response.status}`)
  }

  return response.json() as Promise<T>
}
