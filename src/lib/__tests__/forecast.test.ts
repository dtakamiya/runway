import { calculateForecast } from "../forecast"
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
