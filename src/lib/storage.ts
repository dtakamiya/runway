const STORAGE_KEY = "runway-state"

export type SavedState = {
  formData: {
    totalPoints: string
    startDate: string
    sprintDays: string
    bufferPercent: string
    deadline: string
  }
  phases: Array<{
    id: string
    fromDate: string
    velocity: string
    label: string
  }>
  completedSprints?: Array<{
    id: string
    actualPoints: string
  }>
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage が使えない環境（SSR等）では無視
  }
}

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
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
