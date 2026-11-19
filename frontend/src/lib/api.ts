// Cliente HTTP. Todas las llamadas a la API .NET pasan por aquí:
//  - agrega el access token (JWT) en el header Authorization,
//  - si la API responde 401 (token vencido), renueva la sesión con la cookie y reintenta una vez,
//  - si no se puede renovar, avisa a la app para mandar al login.

import type { AuthResponse } from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5080'

type QueryParams = Record<string, string | number | undefined | null>

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
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
}

async function request<T>(method: string, path: string, options: RequestOptions = {}, canRetry = true): Promise<T> {
  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
    signal: options.signal,
  })

  // Token vencido → renovar y reintentar (excepto en los propios endpoints de auth)
  if (response.status === 401 && canRetry && !path.startsWith('/api/auth/')) {
    const refreshed = await refreshSession()
    if (refreshed) return request<T>(method, path, options, false)
    onSessionExpired?.()
  }

  if (!response.ok) {
    // ASP.NET devuelve errores como ProblemDetails ({ title, detail, status })
    const problem = await response.json().catch(() => null)
    throw new ApiError(response.status, problem?.title ?? defaultMessage(response.status))
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
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
