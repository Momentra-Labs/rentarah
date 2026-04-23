import { API_BASE_URL } from './config'

/**
 * Thrown by {@link request} when the server returns a non-2xx or the response body is not JSON.
 * Map HTTP codes to user-facing copy in the UI layer.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: Method
  /** JSON body; `Content-Type: application/json` is set automatically */
  body?: unknown
  /** Optional AbortSignal for cancellable fetches */
  signal?: AbortSignal
}

const jsonHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

/**
 * Low-level JSON HTTP client. All domain services should go through this (or mock) — never
 * `fetch` inside React components.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(0, 'VITE_API_URL is not set; enable mock data or provide a base URL in .env')
  }

  const { method = 'GET', body, signal } = options
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const res = await fetch(url, {
    method,
    headers: jsonHeaders,
    body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    signal,
  })

  const text = await res.text()
  if (!res.ok) {
    throw new ApiError(res.status, res.statusText || 'Request failed', text)
  }

  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new ApiError(res.status, 'Invalid JSON in response', text)
  }
}

/** Convenience wrapper for `GET` requests. */
export function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'GET', signal })
}

/** Convenience wrapper for `POST` requests with a JSON body. */
export function postJson<T, B = unknown>(path: string, body: B, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: 'POST', body, signal })
}
