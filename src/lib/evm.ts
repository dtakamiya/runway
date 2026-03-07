import type { CompletedSprint, EvmMetrics, Scenario } from "./types"

export function calculateEvmMetrics(
  totalPoints: number,
  completedSprints: readonly CompletedSprint[],
  standardScenario: Scenario
): EvmMetrics | null {
  if (completedSprints.length === 0) return null

  const bac = totalPoints
  const completedSprintCount = completedSprints.length

  // EV = 実績の累計消化ポイント
  const ev = completedSprints.reduce((sum, s) => sum + s.actualPoints, 0)
  if (ev === 0) return null

  // PV = 計画上、完了スプリント数分の累計消化ポイント（BAC上限）
  const plannedSprints = standardScenario.sprints.slice(0, completedSprintCount)
  const pvRaw = plannedSprints.reduce((sum, s) => sum + s.pointsBurned, 0)
  const pv = completedSprintCount > standardScenario.sprints.length ? bac : pvRaw
  if (pv === 0) return null

  // SV, SV%, SPI
  const sv = ev - pv
  const svPercent = Math.round((sv / pv) * 100)
  const spi = Math.round((ev / pv) * 100) / 100

  // 実績ベロシティ平均
  const actualVelocityAvg = Math.round(ev / completedSprintCount)

  // EAC(t) = 実績ベースの完了スプリント数予測
  const remainingPoints = Math.max(0, bac - ev)
  const eacSprints = remainingPoints === 0
    ? completedSprintCount
    : completedSprintCount + Math.ceil(remainingPoints / actualVelocityAvg)

  // TCPI = 残pt / 残計画ベロシティ累積
  const remainingPlannedSprints = standardScenario.sprints.slice(completedSprintCount)
  const remainingPlannedCapacity = remainingPlannedSprints.reduce(
    (sum, s) => sum + s.pointsBurned,
    0
  )
  const tcpi = remainingPlannedCapacity > 0
    ? Math.round((remainingPoints / remainingPlannedCapacity) * 100) / 100
    : null

  return {
    bac,
    pv,
    ev,
    sv,
    svPercent,
    spi,
    eacSprints,
    tcpi,
    completedSprintCount,
    actualVelocityAvg,
  }
}
