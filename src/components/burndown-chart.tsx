"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import type { ForecastResult, VelocityPhase } from "@/lib/types"

type BurndownChartProps = {
  readonly result: ForecastResult
  readonly velocityPhases: readonly VelocityPhase[]
}

type ChartDataPoint = {
  readonly label: string
  readonly optimistic: number
  readonly standard: number
  readonly pessimistic: number
}

function buildChartData(result: ForecastResult): readonly ChartDataPoint[] {
  const maxSprints = Math.max(
    result.optimistic.sprintCount,
    result.standard.sprintCount,
    result.pessimistic.sprintCount
  )

  const totalPoints = result.standard.sprints[0]
    ? result.standard.sprints[0].remainingPoints +
      result.standard.sprints[0].pointsBurned
    : 0

  const data: ChartDataPoint[] = [
    {
      label: "Start",
      optimistic: result.optimistic.totalPoints,
      standard: totalPoints,
      pessimistic: result.pessimistic.totalPoints,
    },
  ]

  for (let i = 0; i < maxSprints; i++) {
    const optSprint = result.optimistic.sprints[i]
    const stdSprint = result.standard.sprints[i]
    const pesSprint = result.pessimistic.sprints[i]

    data.push({
      label: `S${i + 1}`,
      optimistic: optSprint?.remainingPoints ?? 0,
      standard: stdSprint?.remainingPoints ?? 0,
      pessimistic: pesSprint?.remainingPoints ?? 0,
    })
  }

  return data
}

function findPhaseChangeSprintIndices(
  result: ForecastResult,
  phases: readonly VelocityPhase[]
): readonly { index: number; label: string }[] {
  if (phases.length <= 1) return []
  const sorted = [...phases].sort(
    (a, b) => a.fromDate.getTime() - b.fromDate.getTime()
  )

  const markers: { index: number; label: string }[] = []
  for (let p = 1; p < sorted.length; p++) {
    const phaseDate = sorted[p].fromDate
    for (let i = 0; i < result.standard.sprints.length; i++) {
      const sprint = result.standard.sprints[i]
      if (sprint.startDate <= phaseDate && sprint.endDate > phaseDate) {
        markers.push({
          index: i + 1,
          label: sorted[p].label || `vel=${sorted[p].velocity}`,
        })
        break
      }
    }
  }
  return markers
}

export function BurndownChart({ result, velocityPhases }: BurndownChartProps) {
  const data = buildChartData(result)
  const phaseMarkers = findPhaseChangeSprintIndices(result, velocityPhases)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Burndown Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend />

              {phaseMarkers.map((marker) => (
                <ReferenceLine
                  key={marker.index}
                  x={`S${marker.index}`}
                  stroke="#8b5cf6"
                  strokeDasharray="4 4"
                  label={{
                    value: marker.label,
                    position: "top",
                    fontSize: 11,
                    fill: "#8b5cf6",
                  }}
                />
              ))}

              <Area
                type="monotone"
                dataKey="pessimistic"
                name="Pessimistic"
                stroke="#f97316"
                fill="#fed7aa"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="standard"
                name="Standard"
                stroke="#3b82f6"
                fill="#bfdbfe"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="optimistic"
                name="Optimistic"
                stroke="#22c55e"
                fill="#bbf7d0"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
