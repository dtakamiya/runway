/**
 * @jest-environment jsdom
 */
import { saveState, loadState, type SavedState } from "../storage"

const mockState: SavedState = {
  formData: {
    totalPoints: "120",
    startDate: "2026-04-01",
    sprintDays: "14",
    bufferPercent: "20",
    deadline: "2026-09-30",
  },
  phases: [
    { id: "phase-1", fromDate: "2026-04-01", velocity: "20", label: "初期" },
  ],
}

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("saveState はlocalStorageに状態を保存する", () => {
    saveState(mockState)
    const raw = localStorage.getItem("runway-state")
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual(mockState)
  })

  it("loadState は保存済みの状態を返す", () => {
    saveState(mockState)
    const loaded = loadState()
    expect(loaded).toEqual(mockState)
  })

  it("loadState は何も保存されていない場合 null を返す", () => {
    const loaded = loadState()
    expect(loaded).toBeNull()
  })

  it("loadState はJSONが壊れている場合 null を返す", () => {
    localStorage.setItem("runway-state", "{ broken json }")
    const loaded = loadState()
    expect(loaded).toBeNull()
  })

  it("loadState は不完全なデータの場合 null を返す", () => {
    localStorage.setItem("runway-state", JSON.stringify({ formData: null }))
    const loaded = loadState()
    expect(loaded).toBeNull()
  })
})
