import { toCsv } from "../export"
import type { Scenario } from "../types"

const mockScenario: Scenario = {
  totalPoints: 100,
  sprintCount: 3,
  endDate: new Date("2026-05-05"),
  sprints: [
    {
      sprintNumber: 1,
      startDate: new Date("2026-03-10"),
      endDate: new Date("2026-03-24"),
      velocity: 15,
      pointsBurned: 15,
      remainingPoints: 85,
    },
    {
      sprintNumber: 2,
      startDate: new Date("2026-03-24"),
      endDate: new Date("2026-04-07"),
      velocity: 15,
      pointsBurned: 15,
      remainingPoints: 70,
    },
    {
      sprintNumber: 3,
      startDate: new Date("2026-04-07"),
      endDate: new Date("2026-04-21"),
      velocity: 15,
      pointsBurned: 10,
      remainingPoints: 0,
    },
  ],
}

describe("toCsv", () => {
  it("ヘッダー行が含まれる", () => {
    const csv = toCsv(mockScenario)
    const lines = csv.split("\n")
    expect(lines[0]).toBe(
      "スプリント,開始日,終了日,ベロシティ,消化ポイント,残りポイント"
    )
  })

  it("各スプリントが1行になる", () => {
    const csv = toCsv(mockScenario)
    const lines = csv.split("\n").filter((l) => l.trim())
    expect(lines).toHaveLength(4) // ヘッダー + 3スプリント
  })

  it("データが正しいフォーマットで出力される", () => {
    const csv = toCsv(mockScenario)
    const lines = csv.split("\n")
    expect(lines[1]).toBe("S1,2026/03/10,2026/03/24,15,15,85")
  })

  it("最終スプリントのデータが正しい", () => {
    const csv = toCsv(mockScenario)
    const lines = csv.split("\n")
    expect(lines[3]).toBe("S3,2026/04/07,2026/04/21,15,10,0")
  })
})
