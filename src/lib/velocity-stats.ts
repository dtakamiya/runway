export type VelocityStats = {
  readonly average: number
  readonly stdDev: number
  readonly cv: number
  readonly min: number
  readonly max: number
  readonly count: number
}

export function calcVelocityStats(velocities: readonly number[]): VelocityStats {
  if (velocities.length === 0) {
    return { average: 0, stdDev: 0, cv: 0, min: 0, max: 0, count: 0 }
  }

  const count = velocities.length
  const sum = velocities.reduce((a, b) => a + b, 0)
  const average = Math.round((sum / count) * 10) / 10

  const variance =
    velocities.reduce((acc, v) => acc + Math.pow(v - average, 2), 0) / count
  const stdDev = Math.round(Math.sqrt(variance) * 100) / 100

  const cv = average === 0 ? 0 : Math.round((stdDev / average) * 1000) / 10

  const min = Math.min(...velocities)
  const max = Math.max(...velocities)

  return { average, stdDev, cv, min, max, count }
}
