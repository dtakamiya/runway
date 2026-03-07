import type { SavedState } from "./storage"

export function encodeState(state: SavedState): string {
  const json = JSON.stringify(state)
  // URL-safeなbase64: +→- /→_ =を除去することでURLSearchParamsの+→スペース変換問題を回避
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export function decodeState(encoded: string): SavedState | null {
  if (!encoded) return null
  try {
    // URL-safeなbase64を標準のbase64に戻す
    const standard = encoded.replace(/-/g, "+").replace(/_/g, "/")
    const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4)
    const json = decodeURIComponent(escape(atob(padded)))
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
