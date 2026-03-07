import { addDays } from "date-fns"
import type {
  ForecastInput,
  ForecastResult,
  Scenario,
  SprintBreakdown,
  VelocityPhase,
  CompletedSprint,
} from "./types"

type ActualBurndownPoint = {
  readonly sprintIndex: number
  readonly remaining: number
}

function getVelocityForSprint(
  sprintStartDate: Date,
  phases: readonly VelocityPhase[]
): number {
  const sorted = [...phases].sort(
    (a, b) => a.fromDate.getTime() - b.fromDate.getTime()
  )

  let velocity = sorted[0]?.velocity ?? 0
  for (const phase of sorted) {
    if (sprintStartDate >= phase.fromDate) {
      velocity = phase.velocity
    } else {
      break
    }
  }
  return velocity
}

function simulateSprints(
  totalPoints: number,
  startDate: Date,
  sprintDays: number,
  phases: readonly VelocityPhase[]
): readonly SprintBreakdown[] {
  const sprints: SprintBreakdown[] = []
  let remaining = totalPoints
  let sprintNumber = 1
  let currentStart = startDate

  while (remaining > 0) {
    const velocity = getVelocityForSprint(currentStart, phases)
    const burned = Math.min(velocity, remaining)
    remaining = remaining - burned
    const endDate = addDays(currentStart, sprintDays)

    sprints.push({
      sprintNumber,
      velocity,
      pointsBurned: burned,
      remainingPoints: remaining,
      startDate: currentStart,
      endDate,
    })

    currentStart = endDate
    sprintNumber++

    // Safety: prevent infinite loop if velocity is 0
    if (velocity <= 0) break
  }

  return sprints
}

function buildScenario(
  totalPoints: number,
  startDate: Date,
  sprintDays: number,
  phases: readonly VelocityPhase[]
): Scenario {
  const sprints = simulateSprints(totalPoints, startDate, sprintDays, phases)
  const lastSprint = sprints[sprints.length - 1]

  return {
    totalPoints,
    sprintCount: sprints.length,
    endDate: lastSprint?.endDate ?? startDate,
    sprints,
  }
}

function applyBuffer(
  phases: readonly VelocityPhase[],
  factor: number
): readonly VelocityPhase[] {
  return phases.map((phase) => ({
    ...phase,
    velocity: Math.round(phase.velocity * factor),
  }))
}

export function snapToSprintStart(
  phaseDate: Date,
  sprintStartDate: Date,
  sprintDays: number
): Date {
  if (phaseDate <= sprintStartDate) return sprintStartDate
  const diffDays = (phaseDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24)
  const sprintIndex = Math.ceil(diffDays / sprintDays)
  return addDays(sprintStartDate, sprintIndex * sprintDays)
}

export function getIdealRemainingAtDate(
  sprints: readonly SprintBreakdown[],
  date: Date
): number | null {
  const idx = sprints.findIndex(
    (s) => date >= s.startDate && date < s.endDate
  )
  if (idx < 0) return null

  const sprint = sprints[idx]
  const fraction =
    (date.getTime() - sprint.startDate.getTime()) /
    (sprint.endDate.getTime() - sprint.startDate.getTime())
  const startRemaining = sprint.remainingPoints + sprint.pointsBurned
  return startRemaining - fraction * sprint.pointsBurned
}

export function buildActualBurndown(
  totalPoints: number,
  completedSprints: readonly CompletedSprint[],
  _standardSprints: readonly SprintBreakdown[]
): readonly ActualBurndownPoint[] {
  const points: ActualBurndownPoint[] = [{ sprintIndex: 0, remaining: totalPoints }]
  let remaining = totalPoints
  for (const sprint of completedSprints) {
    remaining = Math.max(0, remaining - sprint.actualPoints)
    points.push({ sprintIndex: sprint.sprintNumber, remaining })
  }
  return points
}

export function calculateDelayDays(
  totalPoints: number,
  completedSprints: readonly CompletedSprint[],
  standard: Scenario,
  sprintDays: number
): number {
  if (completedSprints.length === 0) return 0

  const lastIdx = completedSprints.length - 1
  const actualRemaining = Math.max(
    0,
    totalPoints - completedSprints.reduce((sum, s) => sum + s.actualPoints, 0)
  )
  const plannedRemaining = standard.sprints[lastIdx]?.remainingPoints ?? totalPoints
  const pointsBehind = actualRemaining - plannedRemaining

  // 最後の完了スプリントの標準ベロシティで日数に換算
  const velocity = standard.sprints[lastIdx]?.velocity ?? 1
  const delayDays = Math.round((pointsBehind / velocity) * sprintDays)
  return delayDays
}

export function calculateForecast(input: ForecastInput): ForecastResult {
  const { totalPoints, startDate, sprintDays, velocityPhases, bufferPercent } =
    input
  const bufferRatio = bufferPercent / 100

  const optimistic = buildScenario(
    totalPoints,
    startDate,
    sprintDays,
    applyBuffer(velocityPhases, 1 + bufferRatio)
  )

  const standard = buildScenario(
    totalPoints,
    startDate,
    sprintDays,
    velocityPhases
  )

  const pessimistic = buildScenario(
    Math.ceil(totalPoints * (1 + bufferRatio)),
    startDate,
    sprintDays,
    applyBuffer(velocityPhases, 1 - bufferRatio)
  )

  return { optimistic, standard, pessimistic }
}
