/**
 * @jest-environment jsdom
 */
import { encodeState, decodeState } from "../share"
import type { SavedState } from "../storage"

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
    { id: "phase-2", fromDate: "2026-06-01", velocity: "30", label: "増員後" },
  ],
}

describe("share", () => {
  it("encodeState は文字列を返す", () => {
    const encoded = encodeState(mockState)
    expect(typeof encoded).toBe("string")
    expect(encoded.length).toBeGreaterThan(0)
  })

  it("decodeState は encodeState の逆変換ができる", () => {
    const encoded = encodeState(mockState)
    const decoded = decodeState(encoded)
    expect(decoded?.formData.totalPoints).toBe("120")
    expect(decoded?.formData.deadline).toBe("2026-09-30")
    expect(decoded?.phases).toHaveLength(2)
    expect(decoded?.phases[1].label).toBe("増員後")
  })

  it("decodeState は不正な文字列の場合 null を返す", () => {
    expect(decodeState("not-valid-base64!!!")).toBeNull()
  })

  it("decodeState は空文字列の場合 null を返す", () => {
    expect(decodeState("")).toBeNull()
  })

  it("エンコード後のデータは URL クエリに使えるASCII文字のみ含む", () => {
    const encoded = encodeState(mockState)
    // Base64 URL-safe は英数字と -_ のみ
    expect(encoded).toMatch(/^[A-Za-z0-9+/=_-]+$/)
  })
})
