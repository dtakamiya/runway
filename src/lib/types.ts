export type VelocityPhase = {
  readonly fromDate: Date
  readonly velocity: number
  readonly label?: string
}

export type ForecastInput = {
  readonly totalPoints: number
  readonly startDate: Date
  readonly sprintDays: number // 7, 14, 21, 28
  readonly velocityPhases: readonly VelocityPhase[]
  readonly bufferPercent: number
}

export type SprintBreakdown = {
  readonly sprintNumber: number
  readonly velocity: number
  readonly pointsBurned: number
  readonly remainingPoints: number
  readonly startDate: Date
  readonly endDate: Date
}

export type Scenario = {
  readonly totalPoints: number
  readonly sprintCount: number
  readonly endDate: Date
  readonly sprints: readonly SprintBreakdown[]
}

export type ForecastResult = {
  readonly optimistic: Scenario
  readonly standard: Scenario
  readonly pessimistic: Scenario
}

export type CompletedSprint = {
  readonly sprintNumber: number
  readonly actualPoints: number
}
