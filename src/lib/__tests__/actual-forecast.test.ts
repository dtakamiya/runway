import {
  buildActualBurndown,
  calculateDelayDays,
} from "../forecast"
import { calculateForecast } from "../forecast"
import type { ForecastInput, CompletedSprint } from "../types"

const baseInput: ForecastInput = {
  totalPoints: 100,
  startDate: new Date("2026-03-10"),
  sprintDays: 14,
  velocityPhases: [
    { fromDate: new Date("2026-03-10"), velocity: 15 },
  ],
  bufferPercent: 0,
}

describe("buildActualBurndown", () => {
  it("空配列を渡すと開始点のみを返す", () => {
    const result = calculateForecast(baseInput)
    const actual = buildActualBurndown(100, [], result.standard.sprints)
    expect(actual).toHaveLength(1)
    expect(actual[0]).toEqual({ sprintIndex: 0, remaining: 100 })
  })

  it("1スプリント完了時に残りポイントを正しく計算する", () => {
    const result = calculateForecast(baseInput)
    const completed: CompletedSprint[] = [{ sprintNumber: 1, actualPoints: 10 }]
    const actual = buildActualBurndown(100, completed, result.standard.sprints)
    expect(actual).toHaveLength(2)
    expect(actual[0]).toEqual({ sprintIndex: 0, remaining: 100 })
    expect(actual[1]).toEqual({ sprintIndex: 1, remaining: 90 })
  })

  it("複数スプリント完了時に累積残りポイントを計算する", () => {
    const result = calculateForecast(baseInput)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 10 },
      { sprintNumber: 2, actualPoints: 20 },
      { sprintNumber: 3, actualPoints: 5 },
    ]
    const actual = buildActualBurndown(100, completed, result.standard.sprints)
    expect(actual).toHaveLength(4)
    expect(actual[0].remaining).toBe(100)
    expect(actual[1].remaining).toBe(90)
    expect(actual[2].remaining).toBe(70)
    expect(actual[3].remaining).toBe(65)
  })

  it("実績が合計ポイントを超えても0未満にならない", () => {
    const result = calculateForecast(baseInput)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 60 },
      { sprintNumber: 2, actualPoints: 60 },
    ]
    const actual = buildActualBurndown(100, completed, result.standard.sprints)
    expect(actual[2].remaining).toBe(0)
  })
})

describe("calculateDelayDays", () => {
  it("実績が予定通りの場合は0を返す", () => {
    const result = calculateForecast(baseInput)
    // S1完了: 標準では15pt消化 → 85pt残
    const completed: CompletedSprint[] = [{ sprintNumber: 1, actualPoints: 15 }]
    const delay = calculateDelayDays(100, completed, result.standard, 14)
    expect(delay).toBe(0)
  })

  it("実績が予定より少ない場合に正の遅延日数を返す", () => {
    const result = calculateForecast(baseInput)
    // S1完了: 予定15pt → 実績10pt → 5pt遅れ
    const completed: CompletedSprint[] = [{ sprintNumber: 1, actualPoints: 10 }]
    const delay = calculateDelayDays(100, completed, result.standard, 14)
    expect(delay).toBeGreaterThan(0)
  })

  it("実績が予定より多い場合に負の値（前倒し）を返す", () => {
    const result = calculateForecast(baseInput)
    // S1完了: 予定15pt → 実績20pt → 5pt前倒し
    const completed: CompletedSprint[] = [{ sprintNumber: 1, actualPoints: 20 }]
    const delay = calculateDelayDays(100, completed, result.standard, 14)
    expect(delay).toBeLessThan(0)
  })

  it("完了スプリントがない場合は0を返す", () => {
    const result = calculateForecast(baseInput)
    const delay = calculateDelayDays(100, [], result.standard, 14)
    expect(delay).toBe(0)
  })
})
