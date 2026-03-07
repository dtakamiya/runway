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

  it("エンコード後のデータは URL クエリに使えるASCII文字のみ含む（+や/を含まない）", () => {
    const encoded = encodeState(mockState)
    // URL-safe base64: +と/と=を含まない
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/)
    expect(encoded).not.toContain("+")
    expect(encoded).not.toContain("/")
    expect(encoded).not.toContain("=")
  })

  it("URLSearchParams経由でデコードしても正しく復元できる（+のスペース変換問題がない）", () => {
    const encoded = encodeState(mockState)
    // URLSearchParamsはURL-safeなbase64の文字列を変換しない
    const params = new URLSearchParams(`s=${encoded}`)
    const fromParams = params.get("s")
    const decoded = decodeState(fromParams!)
    expect(decoded?.formData.totalPoints).toBe("120")
    expect(decoded?.phases[1].label).toBe("増員後")
  })

  it("日本語ラベルを含む状態でも URLSearchParams 経由で正しく復元できる", () => {
    const stateWithJapanese: SavedState = {
      formData: {
        totalPoints: "100",
        startDate: "2026-03-10",
        sprintDays: "14",
        bufferPercent: "20",
        deadline: "",
      },
      phases: [
        { id: "p1", fromDate: "2026-03-10", velocity: "15", label: "3人チーム" },
      ],
    }
    const encoded = encodeState(stateWithJapanese)
    const params = new URLSearchParams(`s=${encoded}`)
    const fromParams = params.get("s")
    const decoded = decodeState(fromParams!)
    expect(decoded?.formData.sprintDays).toBe("14")
    expect(decoded?.phases[0].label).toBe("3人チーム")
  })
})
