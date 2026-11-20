// Cliente HTTP. Todas las llamadas a la API .NET pasan por aquí:
//  - agrega el access token (JWT) en el header Authorization,
//  - si la API responde 401 (token vencido), renueva la sesión con la cookie y reintenta una vez,
//  - si no se puede renovar, avisa a la app para mandar al login.

import type { AuthResponse } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5080'

type QueryParams = Record<string, string | number | undefined | null>

export class ApiError extends Error {
  readonly status: number
  /** Errores de validación por campo, p. ej. { price: "El precio debe ser mayor a 0." } */
  readonly fieldErrors: Record<string, string>
  readonly detail?: string

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}, detail?: string) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.detail = detail
  }
}

// ---------- Estado de sesión ----------
// El access token vive SOLO en memoria (no en localStorage): un script malicioso no puede robarlo
// del almacenamiento. Al recargar la página se recupera con la cookie HttpOnly del refresh token.
let accessToken: string | null = null
let onSessionExpired: (() => void) | null = null

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler
}

// Si varias peticiones reciben 401 al mismo tiempo, comparten UNA sola renovación.
// (Importante: cada refresh token sirve una sola vez; dos renovaciones simultáneas
// harían que el servidor detecte "reutilización" y cierre la sesión.)
let refreshInFlight: Promise<AuthResponse | null> | null = null

export function refreshSession(): Promise<AuthResponse | null> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(new URL('/api/auth/refresh', API_URL), {
        method: 'POST',
        credentials: 'include', // envía la cookie HttpOnly
      })
      if (!response.ok) {
        accessToken = null
        return null
      }
      const data = (await response.json()) as AuthResponse
      accessToken = data.accessToken
      return data
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

// ---------- Peticiones ----------
interface RequestOptions {
  params?: QueryParams
  body?: unknown
  signal?: AbortSignal
  responseType?: 'json' | 'blob'
}

async function request<T>(method: string, path: string, options: RequestOptions = {}, canRetry = true): Promise<T> {
  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
      signal: options.signal,
    })
  } catch (error) {
    // Cancelaciones (TanStack Query aborta peticiones viejas): se dejan pasar tal cual
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    // El navegador solo dice "Failed to fetch": la API está apagada o no hay red
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa que la API esté encendida e inténtalo de nuevo.')
  }

  // Token vencido → renovar y reintentar (excepto en los propios endpoints de auth)
  if (response.status === 401 && canRetry && !path.startsWith('/api/auth/')) {
    const refreshed = await refreshSession()
    if (refreshed) return request<T>(method, path, options, false)
    onSessionExpired?.()
  }

  if (!response.ok) {
    // ASP.NET devuelve errores como ProblemDetails ({ title, detail, status, errors? })
    const problem = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      problem?.title ?? defaultMessage(response.status),
      toFieldErrors(problem?.errors),
      problem?.detail,
    )
  }

  if (response.status === 204) return undefined as T
  if (options.responseType === 'blob') {
    return { blob: await response.blob(), fileName: fileNameFrom(response) } as T
  }
  return response.json() as Promise<T>
}

/** { "Price": ["..."] } → { price: "..." } (camelCase, primer mensaje) para mostrarlo junto a cada input. */
function toFieldErrors(errors: unknown): Record<string, string> {
  if (!errors || typeof errors !== 'object') return {}
  return Object.fromEntries(
    Object.entries(errors as Record<string, string[]>).map(([key, messages]) => [
      key.charAt(0).toLowerCase() + key.slice(1),
      messages[0] ?? '',
    ]),
  )
}

function fileNameFrom(response: Response) {
  const header = response.headers.get('Content-Disposition') ?? ''
  const match = /filename\*=UTF-8''([^;]+)/i.exec(header) ?? /filename="?([^";]+)"?/i.exec(header)
  return match ? decodeURIComponent(match[1]) : 'descarga'
}

function defaultMessage(status: number) {
  if (status === 401) return 'Tu sesión expiró'
  if (status === 403) return 'No tienes permiso para ver esto'
  if (status === 429) return 'Demasiados intentos, espera un minuto'
  return `Error ${status}`
}

export const apiGet = <T>(path: string, params?: QueryParams, signal?: AbortSignal) =>
  request<T>('GET', path, { params, signal })

export const apiPost = <T>(path: string, body?: unknown) => request<T>('POST', path, { body })

export const apiPut = <T>(path: string, body: unknown) => request<T>('PUT', path, { body })

export const apiDelete = (path: string) => request<void>('DELETE', path)

/**
 * Descarga un archivo (p. ej. Excel). Se usa fetch (y no un simple <a href>) porque la
 * petición necesita el token en el header Authorization.
 */
export async function apiDownload(path: string, params?: QueryParams) {
  const { blob, fileName } = await request<{ blob: Blob; fileName: string }>('GET', path, {
    params,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000) // liberar memoria cuando el navegador ya tomó el archivo
}
