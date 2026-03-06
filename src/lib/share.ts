import type { SavedState } from "./storage"

export function encodeState(state: SavedState): string {
  const json = JSON.stringify(state)
  return btoa(unescape(encodeURIComponent(json)))
}

export function decodeState(encoded: string): SavedState | null {
  if (!encoded) return null
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    const parsed = JSON.parse(json) as unknown
    if (!isValidState(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function isValidState(value: unknown): value is SavedState {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.formData === "object" &&
    v.formData !== null &&
    Array.isArray(v.phases)
  )
}
