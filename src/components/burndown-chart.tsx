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
  ReferenceDot,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import type { ForecastResult, SprintBreakdown, VelocityPhase } from "@/lib/types"
import { roundPt } from "@/lib/utils"
import { getIdealRemainingAtDate } from "@/lib/forecast"

type BurndownChartProps = {
  readonly result: ForecastResult
  readonly velocityPhases: readonly VelocityPhase[]
  readonly deadline?: string
}

type ChartDataPoint = {
  readonly label: string
  readonly sprintNum: string
  readonly optimistic: number | undefined
  readonly standard: number | undefined
  readonly pessimistic: number | undefined
}

function interpolateRemaining(
  sprints: readonly SprintBreakdown[],
  idx: number,
  fraction: number
): number {
  const sprint = sprints[idx]
  if (!sprint) return 0
  const startRemaining = sprint.remainingPoints + sprint.pointsBurned
  return roundPt(startRemaining - fraction * sprint.pointsBurned)
}

type SpecialPoint = {
  readonly date: Date
  readonly label: string
  readonly sprintNum: string
}

function buildChartData(
  result: ForecastResult,
  today: Date,
  deadline?: Date
): readonly ChartDataPoint[] {
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
      optimistic: optSprint !== undefined ? roundPt(optSprint.remainingPoints) : undefined,
      standard: stdSprint !== undefined ? roundPt(stdSprint.remainingPoints) : undefined,
      pessimistic: pesSprint !== undefined ? roundPt(pesSprint.remainingPoints) : undefined,
    })
  }

  // 今日・デッドラインのデータポイントを収集し、日付昇順で挿入
  const specialPoints: SpecialPoint[] = []

  const todaySprintIdx = result.standard.sprints.findIndex(
    (s) => today >= s.startDate && today < s.endDate
  )
  if (todaySprintIdx >= 0) {
    specialPoints.push({ date: today, label: format(today, "M/d"), sprintNum: "今日" })
  }

  if (deadline) {
    const dlSprintIdx = result.standard.sprints.findIndex(
      (s) => deadline >= s.startDate && deadline < s.endDate
    )
    if (dlSprintIdx >= 0) {
      specialPoints.push({ date: deadline, label: format(deadline, "M/d"), sprintNum: "DL" })
    }
  }

  specialPoints.sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const sp of specialPoints) {
    if (data.some((d) => d.label === sp.label)) continue

    const sprintIdx = result.standard.sprints.findIndex(
      (s) => sp.date >= s.startDate && sp.date < s.endDate
    )
    if (sprintIdx < 0) continue

    const stdSprint = result.standard.sprints[sprintIdx]
    const fraction =
      (sp.date.getTime() - stdSprint.startDate.getTime()) /
      (stdSprint.endDate.getTime() - stdSprint.startDate.getTime())

    // スプリント終了日ラベルの直前に挿入
    const sprintEndLabel = format(result.standard.sprints[sprintIdx].endDate, "M/d")
    const insertIdx = data.findIndex((d) => d.label === sprintEndLabel)
    if (insertIdx >= 0) {
      data.splice(insertIdx, 0, {
        label: sp.label,
        sprintNum: sp.sprintNum,
        optimistic: interpolateRemaining(result.optimistic.sprints, sprintIdx, fraction),
        standard: interpolateRemaining(result.standard.sprints, sprintIdx, fraction),
        pessimistic: interpolateRemaining(result.pessimistic.sprints, sprintIdx, fraction),
      })
    }
  }

  return data
}

export function findPhaseChangeMarkers(
  result: ForecastResult,
  phases: readonly VelocityPhase[]
): readonly { xLabel: string; markerLabel: string }[] {
  if (phases.length <= 1) return []
  const sorted = [...phases].sort(
    (a, b) => a.fromDate.getTime() - b.fromDate.getTime()
  )

  const markers: { xLabel: string; markerLabel: string }[] = []
  for (let p = 1; p < sorted.length; p++) {
    const phaseDate = sorted[p].fromDate
    for (let i = 0; i < result.standard.sprints.length; i++) {
      const sprint = result.standard.sprints[i]
      if (sprint.startDate >= phaseDate) {
        markers.push({
          xLabel: format(sprint.startDate, "M/d"),
          markerLabel: sorted[p].label || `vel=${sorted[p].velocity}`,
        })
        break
      }
    }
  }
  return markers
}

export function BurndownChart({ result, velocityPhases, deadline }: BurndownChartProps) {
  const today = new Date()
  const deadlineDate = deadline ? parseISO(deadline) : undefined
  const data = buildChartData(result, today, deadlineDate)
  const phaseMarkers = findPhaseChangeMarkers(result, velocityPhases)

  // 今日のデータポイントがチャートデータに存在するか確認
  const isTodayInSprints = result.standard.sprints.some(
    (s) => today >= s.startDate && today < s.endDate
  )
  const todayLabel = isTodayInSprints ? format(today, "M/d") : null

  // 今日時点の標準シナリオ理想残ポイント
  const idealRemainingRaw = isTodayInSprints
    ? getIdealRemainingAtDate(result.standard.sprints, today)
    : null
  const idealRemaining = idealRemainingRaw !== null ? Math.round(idealRemainingRaw) : null

  // デッドラインのデータポイントがチャートデータに存在するか確認
  const deadlineLabel = deadlineDate && data.some((d) => d.label === format(deadlineDate, "M/d"))
    ? format(deadlineDate, "M/d")
    : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">バーンダウンチャート</CardTitle>
          {idealRemaining !== null && (
            <span className="ml-auto text-xs text-muted-foreground">
              今日の理想残: <strong className="text-foreground">{idealRemaining} pt</strong>
            </span>
          )}
        </div>
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

              {todayLabel && idealRemaining !== null && (
                <ReferenceDot
                  x={todayLabel}
                  y={idealRemaining}
                  r={6}
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth={2}
                />
              )}

              {deadlineLabel && (
                <ReferenceLine
                  x={deadlineLabel}
                  stroke="#ef4444"
                  strokeDasharray="6 3"
                  label={{
                    value: `DL: ${deadlineLabel}`,
                    position: "top",
                    fontSize: 11,
                    fill: "#ef4444",
                  }}
                />
              )}

              {phaseMarkers.map((marker) => (
                <ReferenceLine
                  key={marker.xLabel}
                  x={marker.xLabel}
                  stroke="#8b5cf6"
                  strokeDasharray="4 4"
                  label={{
                    value: marker.markerLabel,
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
