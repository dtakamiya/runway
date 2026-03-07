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
  readonly highVelocity: Scenario
  readonly standard: Scenario
  readonly lowVelocity: Scenario
}

export type CompletedSprint = {
  readonly sprintNumber: number
  readonly actualPoints: number
}

export type EvmMetrics = {
  readonly bac: number
  readonly pv: number
  readonly ev: number
  readonly sv: number
  readonly svPercent: number
  readonly spi: number
  readonly eacSprints: number
  readonly tcpi: number | null
  readonly completedSprintCount: number
  readonly actualVelocityAvg: number
}
