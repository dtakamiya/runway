import { addDays } from "date-fns"
import type {
  ForecastInput,
  ForecastResult,
  Scenario,
  SprintBreakdown,
  VelocityPhase,
} from "./types"

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
