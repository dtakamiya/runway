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
import { roundPt } from "@/lib/utils"

type BurndownChartProps = {
  readonly result: ForecastResult
  readonly velocityPhases: readonly VelocityPhase[]
}

type ChartDataPoint = {
  readonly label: string
  readonly sprintNum: string
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

  const startDate = result.standard.sprints[0]?.startDate
  const startLabel = startDate ? format(startDate, "M/d") : "開始"

  const data: ChartDataPoint[] = [
    {
      label: startLabel,
      sprintNum: "開始",
      optimistic: result.optimistic.totalPoints,
      standard: totalPoints,
      pessimistic: result.pessimistic.totalPoints,
    },
  ]

  for (let i = 0; i < maxSprints; i++) {
    const optSprint = result.optimistic.sprints[i]
    const stdSprint = result.standard.sprints[i]
    const pesSprint = result.pessimistic.sprints[i]

    // X軸ラベルは標準シナリオの日付を優先、なければ悲観シナリオの日付
    const sprint = stdSprint ?? pesSprint
    const dateLabel = sprint ? format(sprint.endDate, "M/d") : `S${i + 1}`

    data.push({
      label: dateLabel,
      sprintNum: `S${i + 1}`,
      optimistic: roundPt(optSprint?.remainingPoints ?? 0),
      standard: roundPt(stdSprint?.remainingPoints ?? 0),
      pessimistic: roundPt(pesSprint?.remainingPoints ?? 0),
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

  // 今日のマーカー位置を特定
  const today = new Date()
  const todayLabel = (() => {
    for (let i = 0; i < result.standard.sprints.length; i++) {
      const sprint = result.standard.sprints[i]
      if (today >= sprint.startDate && today < sprint.endDate) {
        return data[i + 1]?.label
      }
    }
    return null
  })()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">バーンダウンチャート</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="label"
                fontSize={11}
                angle={-35}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                fontSize={12}
                label={{
                  value: "残り pt",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fontSize: 11,
                  fill: "currentColor",
                }}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelFormatter={(label, payload) => {
                  const sprintNum = (payload?.[0]?.payload as ChartDataPoint)?.sprintNum
                  return sprintNum ? `${sprintNum} (${label})` : label
                }}
              />
              <Legend />

              {todayLabel && (
                <ReferenceLine
                  x={todayLabel}
                  stroke="#64748b"
                  strokeDasharray="6 3"
                  label={{
                    value: "今日",
                    position: "top",
                    fontSize: 11,
                    fill: "#64748b",
                  }}
                />
              )}

              {phaseMarkers.map((marker) => (
                <ReferenceLine
                  key={marker.index}
                  x={data[marker.index]?.label ?? `S${marker.index}`}
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
                name="悲観"
                stroke="#f97316"
                fill="#fed7aa"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="standard"
                name="標準"
                stroke="#3b82f6"
                fill="#bfdbfe"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="optimistic"
                name="楽観"
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
