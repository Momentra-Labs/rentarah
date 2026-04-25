/** Namespaced localStorage helpers for optional non-Zustand keys */

const PREFIX = 'rentara:'

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function lsSet(key: string, value: unknown) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function lsRemove(key: string) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}
