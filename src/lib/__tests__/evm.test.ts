import { calculateEvmMetrics } from "../evm"
import type { Scenario, CompletedSprint } from "../types"

function makeScenario(sprintVelocities: number[], totalPoints: number): Scenario {
  const sprints = []
  let remaining = totalPoints
  for (let i = 0; i < sprintVelocities.length; i++) {
    const velocity = sprintVelocities[i]
    const burned = Math.min(velocity, remaining)
    remaining = remaining - burned
    sprints.push({
      sprintNumber: i + 1,
      velocity,
      pointsBurned: burned,
      remainingPoints: remaining,
      startDate: new Date(2026, 2, 10 + i * 14),
      endDate: new Date(2026, 2, 24 + i * 14),
    })
  }
  const last = sprints[sprints.length - 1]
  return {
    totalPoints,
    sprintCount: sprints.length,
    endDate: last?.endDate ?? new Date(2026, 2, 10),
    sprints,
  }
}

describe("calculateEvmMetrics", () => {
  it("completedSprints が空 → null を返す", () => {
    const scenario = makeScenario([10, 10, 10], 30)
    const result = calculateEvmMetrics(30, [], scenario)
    expect(result).toBeNull()
  })

  it("予定通り進捗 → SPI=1.0, SV=0", () => {
    const scenario = makeScenario([10, 10, 10], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 10 },
      { sprintNumber: 2, actualPoints: 10 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).not.toBeNull()
    expect(result!.bac).toBe(30)
    expect(result!.pv).toBe(20) // S1:10 + S2:10
    expect(result!.ev).toBe(20) // 10 + 10
    expect(result!.sv).toBe(0)
    expect(result!.svPercent).toBe(0)
    expect(result!.spi).toBe(1.0)
    expect(result!.completedSprintCount).toBe(2)
    expect(result!.actualVelocityAvg).toBe(10)
  })

  it("遅延中 → SPI<1.0, SV<0", () => {
    const scenario = makeScenario([10, 10, 10], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 5 },
      { sprintNumber: 2, actualPoints: 7 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).not.toBeNull()
    expect(result!.pv).toBe(20)
    expect(result!.ev).toBe(12)
    expect(result!.sv).toBe(-8)
    expect(result!.svPercent).toBe(-40)
    expect(result!.spi).toBeCloseTo(0.6)
    expect(result!.actualVelocityAvg).toBe(6)
  })

  it("前倒し → SPI>1.0, SV>0", () => {
    const scenario = makeScenario([10, 10, 10], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 15 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).not.toBeNull()
    expect(result!.pv).toBe(10)
    expect(result!.ev).toBe(15)
    expect(result!.sv).toBe(5)
    expect(result!.svPercent).toBe(50)
    expect(result!.spi).toBe(1.5)
  })

  it("EAC(t) を正しく計算する", () => {
    const scenario = makeScenario([10, 10, 10], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 5 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).not.toBeNull()
    // 完了: 1スプリント、残: 25pt、平均ベロシティ: 5
    // EAC(t) = 1 + 25/5 = 6
    expect(result!.eacSprints).toBe(6)
  })

  it("TCPI を正しく計算する", () => {
    const scenario = makeScenario([10, 10, 10, 10], 40)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 5 },
      { sprintNumber: 2, actualPoints: 5 },
    ]
    const result = calculateEvmMetrics(40, completed, scenario)
    expect(result).not.toBeNull()
    // 残pt: 40 - 10 = 30
    // 残計画ベロシティ累積: S3(10) + S4(10) = 20
    // TCPI = 30 / 20 = 1.5
    expect(result!.tcpi).toBe(1.5)
  })

  it("全完了済み → 適切な処理", () => {
    const scenario = makeScenario([10, 10, 10], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 10 },
      { sprintNumber: 2, actualPoints: 10 },
      { sprintNumber: 3, actualPoints: 10 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).not.toBeNull()
    expect(result!.ev).toBe(30)
    expect(result!.spi).toBe(1.0)
    expect(result!.eacSprints).toBe(3) // 全完了なので完了スプリント数そのもの
    expect(result!.tcpi).toBeNull() // 残計画なし
  })

  it("実績ベロシティ0 → null を返す", () => {
    const scenario = makeScenario([10, 10, 10], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 0 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).toBeNull()
  })

  it("completedSprints.length > standard.sprints.length → PV = BAC", () => {
    const scenario = makeScenario([15, 15], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 8 },
      { sprintNumber: 2, actualPoints: 8 },
      { sprintNumber: 3, actualPoints: 8 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).not.toBeNull()
    // PV should be capped at BAC (30)
    expect(result!.pv).toBe(30)
    expect(result!.ev).toBe(24)
  })

  it("PV = 0 のとき null を返す", () => {
    // velocity 0 のシナリオ → pointsBurned = 0
    const scenario = makeScenario([0], 30)
    const completed: CompletedSprint[] = [
      { sprintNumber: 1, actualPoints: 5 },
    ]
    const result = calculateEvmMetrics(30, completed, scenario)
    expect(result).toBeNull()
  })
})
