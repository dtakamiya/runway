import { calculateForecast, getIdealRemainingAtDate, snapToSprintStart } from "../forecast"
import type { ForecastInput } from "../types"

describe("calculateForecast", () => {
  const baseInput: ForecastInput = {
    totalPoints: 100,
    startDate: new Date("2026-03-10"),
    sprintDays: 14,
    velocityPhases: [
      { fromDate: new Date("2026-03-10"), velocity: 15, label: "3-person team" },
      { fromDate: new Date("2026-04-01"), velocity: 25, label: "2 added" },
    ],
    bufferPercent: 20,
  }

  it("should return standard scenario with correct sprint count", () => {
    const result = calculateForecast(baseInput)
    // S1(vel15)85 -> S2(vel15)70 -> S3(vel25)45 -> S4(vel25)20 -> S5(vel25)0 = 5 sprints
    expect(result.standard.sprintCount).toBe(5)
    expect(result.standard.totalPoints).toBe(100)
  })

  it("should have remaining 0 at the end for standard", () => {
    const result = calculateForecast(baseInput)
    const lastSprint =
      result.standard.sprints[result.standard.sprints.length - 1]
    expect(lastSprint.remainingPoints).toBe(0)
  })

  it("should produce optimistic faster than standard", () => {
    const result = calculateForecast(baseInput)
    expect(result.optimistic.sprintCount).toBeLessThanOrEqual(
      result.standard.sprintCount
    )
  })

  it("should produce pessimistic slower than standard", () => {
    const result = calculateForecast(baseInput)
    expect(result.pessimistic.sprintCount).toBeGreaterThanOrEqual(
      result.standard.sprintCount
    )
  })

  it("should apply buffer correctly for pessimistic", () => {
    const result = calculateForecast(baseInput)
    // Pessimistic totalPoints = 100 * 1.2 = 120
    expect(result.pessimistic.totalPoints).toBe(120)
  })

  it("should handle single phase", () => {
    const input: ForecastInput = {
      totalPoints: 50,
      startDate: new Date("2026-03-10"),
      sprintDays: 7,
      velocityPhases: [{ fromDate: new Date("2026-03-10"), velocity: 10 }],
      bufferPercent: 10,
    }
    const result = calculateForecast(input)
    expect(result.standard.sprintCount).toBe(5) // 50/10 = 5
  })

  it("should handle last sprint burning partial points", () => {
    const input: ForecastInput = {
      totalPoints: 25,
      startDate: new Date("2026-03-10"),
      sprintDays: 14,
      velocityPhases: [{ fromDate: new Date("2026-03-10"), velocity: 10 }],
      bufferPercent: 0,
    }
    const result = calculateForecast(input)
    expect(result.standard.sprintCount).toBe(3)
    const lastSprint =
      result.standard.sprints[result.standard.sprints.length - 1]
    expect(lastSprint.pointsBurned).toBe(5)
    expect(lastSprint.remainingPoints).toBe(0)
  })

  it("should calculate correct sprint dates", () => {
    const result = calculateForecast(baseInput)
    const s1 = result.standard.sprints[0]
    expect(s1.startDate).toEqual(new Date("2026-03-10"))
    expect(s1.endDate).toEqual(new Date("2026-03-24"))

    const s2 = result.standard.sprints[1]
    expect(s2.startDate).toEqual(new Date("2026-03-24"))
    expect(s2.endDate).toEqual(new Date("2026-04-07"))
  })

  it("should switch velocity at the correct sprint", () => {
    const result = calculateForecast(baseInput)
    // S1: 03/10-03/24, vel=15
    // S2: 03/24-04/07, vel=15 (start is 03/24, before 04/01)
    // S3: 04/07-04/21, vel=25 (start is 04/07, after 04/01)
    expect(result.standard.sprints[0].velocity).toBe(15)
    expect(result.standard.sprints[1].velocity).toBe(15)
    expect(result.standard.sprints[2].velocity).toBe(25)
  })
})

describe("getIdealRemainingAtDate", () => {
  // S1: 03/10-03/24, vel=15, remaining=85
  // S2: 03/24-04/07, vel=15, remaining=70
  // S3: 04/07-04/21, vel=25, remaining=45
  const baseInput: ForecastInput = {
    totalPoints: 100,
    startDate: new Date("2026-03-10"),
    sprintDays: 14,
    velocityPhases: [
      { fromDate: new Date("2026-03-10"), velocity: 15 },
      { fromDate: new Date("2026-04-01"), velocity: 25 },
    ],
    bufferPercent: 0,
  }

  it("returns totalPoints at sprint start date (fraction=0)", () => {
    const result = calculateForecast(baseInput)
    const val = getIdealRemainingAtDate(result.standard.sprints, new Date("2026-03-10"))
    expect(val).toBe(100)
  })

  it("interpolates correctly at sprint midpoint", () => {
    const result = calculateForecast(baseInput)
    // S1 midpoint: 03/17 (7 days into 14-day sprint)
    // startRemaining=100, burned=0.5*15=7.5 => 92.5
    const val = getIdealRemainingAtDate(result.standard.sprints, new Date("2026-03-17"))
    expect(val).toBe(92.5)
  })

  it("returns remainingPoints at sprint end date (fraction=1)", () => {
    const result = calculateForecast(baseInput)
    // S1 end (=S2 start): 03/24 -> falls in S2, fraction=0
    // startRemaining = 70+15 = 85, burned = 0 => 85
    const val = getIdealRemainingAtDate(result.standard.sprints, new Date("2026-03-24"))
    expect(val).toBe(85)
  })

  it("returns null when date is before all sprints", () => {
    const result = calculateForecast(baseInput)
    const val = getIdealRemainingAtDate(result.standard.sprints, new Date("2026-03-09"))
    expect(val).toBeNull()
  })

  it("returns null when date is after all sprints", () => {
    const result = calculateForecast(baseInput)
    const lastSprint = result.standard.sprints[result.standard.sprints.length - 1]
    const val = getIdealRemainingAtDate(result.standard.sprints, lastSprint.endDate)
    expect(val).toBeNull()
  })
})

describe("snapToSprintStart", () => {
  // スプリント開始日: 3/10, 3/24, 4/7, 4/21...（14日間隔）
  const sprintStart = new Date("2026-03-10")
  const sprintDays = 14

  it("スプリント開始日ぴったりの場合はそのままの日付を返す", () => {
    expect(snapToSprintStart(new Date("2026-03-10"), sprintStart, sprintDays))
      .toEqual(new Date("2026-03-10"))
  })

  it("スプリント途中の日付は次のスプリント開始日にスナップする", () => {
    // 3/15 は S1(3/10-3/24)の途中 → 次のスプリント開始日 3/24 へ
    expect(snapToSprintStart(new Date("2026-03-15"), sprintStart, sprintDays))
      .toEqual(new Date("2026-03-24"))
  })

  it("スプリント2の開始日ぴったりはそのまま返す", () => {
    expect(snapToSprintStart(new Date("2026-03-24"), sprintStart, sprintDays))
      .toEqual(new Date("2026-03-24"))
  })

  it("スプリント3の途中の日付はスプリント4の開始日にスナップする", () => {
    // 4/10 は S3(4/7-4/21)の途中 → 4/21 へ
    expect(snapToSprintStart(new Date("2026-04-10"), sprintStart, sprintDays))
      .toEqual(new Date("2026-04-21"))
  })

  it("スプリント開始前の日付は最初のスプリント開始日を返す", () => {
    expect(snapToSprintStart(new Date("2026-03-05"), sprintStart, sprintDays))
      .toEqual(new Date("2026-03-10"))
  })
})
