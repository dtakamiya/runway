"use client"

import { useState, useEffect } from "react"
import {
  ComposedChart,
  Area,
  Line,
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
import type { ForecastResult, VelocityPhase, CompletedSprint } from "@/lib/types"
import { roundPt } from "@/lib/utils"
import { getIdealRemainingAtDate, buildActualBurndown, calculateDelayDays } from "@/lib/forecast"
import { useTheme } from "@/hooks/use-theme"

type BurndownChartProps = {
  readonly result: ForecastResult
  readonly velocityPhases: readonly VelocityPhase[]
  readonly deadline?: string
  readonly completedSprints?: readonly CompletedSprint[]
  readonly totalPoints?: number
}

type ChartDataPoint = {
  readonly label: string
  readonly sprintNum: string
  readonly highVelocity: number | null | undefined
  readonly standard: number | null | undefined
  readonly lowVelocity: number | null | undefined
  readonly actual?: number | null
}

type SpecialPoint = {
  readonly date: Date
  readonly label: string
  readonly sprintNum: string
}

export function buildBaseDataPoints(
  result: ForecastResult,
  actualBySprintIndex: Map<number, number>
): ChartDataPoint[] {
  const maxSprints = Math.max(
    result.highVelocity.sprintCount,
    result.standard.sprintCount,
    result.lowVelocity.sprintCount
  )

  const totalPointsVal = result.standard.sprints[0]
    ? result.standard.sprints[0].remainingPoints + result.standard.sprints[0].pointsBurned
    : 0

  const startDate = result.standard.sprints[0]?.startDate
  const startLabel = startDate ? format(startDate, "M/d") : "開始"

  const data: ChartDataPoint[] = [
    {
      label: startLabel,
      sprintNum: "開始",
      highVelocity: result.highVelocity.totalPoints,
      standard: totalPointsVal,
      lowVelocity: result.lowVelocity.totalPoints,
      actual: actualBySprintIndex.has(0) ? actualBySprintIndex.get(0) : undefined,
    },
  ]

  for (let i = 0; i < maxSprints; i++) {
    const highSprint = result.highVelocity.sprints[i]
    const stdSprint = result.standard.sprints[i]
    const lowSprint = result.lowVelocity.sprints[i]

    // X軸ラベルは標準シナリオの日付を優先、なければ不調シナリオの日付
    const sprint = stdSprint ?? lowSprint
    const dateLabel = sprint ? format(sprint.endDate, "M/d") : `S${i + 1}`
    const sprintIndex = i + 1

    data.push({
      label: dateLabel,
      sprintNum: `S${sprintIndex}`,
      highVelocity: highSprint !== undefined ? roundPt(highSprint.remainingPoints) : undefined,
      standard: stdSprint !== undefined ? roundPt(stdSprint.remainingPoints) : undefined,
      lowVelocity: lowSprint !== undefined ? roundPt(lowSprint.remainingPoints) : undefined,
      actual: actualBySprintIndex.has(sprintIndex)
        ? actualBySprintIndex.get(sprintIndex)
        : undefined,
    })
  }

  return data
}

export function collectSpecialPoints(
  result: ForecastResult,
  today: Date,
  deadline?: Date
): readonly SpecialPoint[] {
  const points: SpecialPoint[] = []

  const todaySprintIdx = result.standard.sprints.findIndex(
    (s) => today >= s.startDate && today < s.endDate
  )
  if (todaySprintIdx >= 0) {
    points.push({ date: today, label: format(today, "M/d"), sprintNum: "今日" })
  }

  if (deadline) {
    const dlSprintIdx = result.standard.sprints.findIndex(
      (s) => deadline >= s.startDate && deadline < s.endDate
    )
    if (dlSprintIdx >= 0) {
      points.push({ date: deadline, label: format(deadline, "M/d"), sprintNum: "DL" })
    }
  }

  return points.sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function buildChartData(
  result: ForecastResult,
  today: Date,
  deadline?: Date,
  completedSprints?: readonly CompletedSprint[],
  totalPoints?: number
): readonly ChartDataPoint[] {
  const actualBurndown =
    completedSprints && totalPoints !== undefined
      ? buildActualBurndown(totalPoints, completedSprints, result.standard.sprints)
      : []
  const actualBySprintIndex = new Map(
    actualBurndown.map((p) => [p.sprintIndex, p.remaining])
  )

  const data = buildBaseDataPoints(result, actualBySprintIndex)
  const specialPoints = collectSpecialPoints(result, today, deadline)

  // 今日・デッドラインのデータポイントをスプリント終了日ラベルの直前に挿入
  // （null を使い、connectNulls でカーブ形状を保持）
  for (const sp of specialPoints) {
    if (data.some((d) => d.label === sp.label)) continue

    const sprintIdx = result.standard.sprints.findIndex(
      (s) => sp.date >= s.startDate && sp.date < s.endDate
    )
    if (sprintIdx < 0) continue

    const sprintEndLabel = format(result.standard.sprints[sprintIdx].endDate, "M/d")
    const insertIdx = data.findIndex((d) => d.label === sprintEndLabel)
    if (insertIdx >= 0) {
      data.splice(insertIdx, 0, {
        label: sp.label,
        sprintNum: sp.sprintNum,
        highVelocity: null,
        standard: null,
        lowVelocity: null,
      })
    }
  }

  return data
}

export function findPhaseChangeMarkers(
  result: ForecastResult,
  phases: readonly VelocityPhase[]
): readonly { xLabel: string; markerLabel: string; isFirst: boolean }[] {
  if (phases.length <= 1) return []
  const sorted = [...phases].sort(
    (a, b) => a.fromDate.getTime() - b.fromDate.getTime()
  )

  const markers: { xLabel: string; markerLabel: string; isFirst: boolean }[] = []

  // フェーズ1（最初のフェーズ）は最初のスプリント開始位置に縦線のみ（ラベルなし）
  const firstSprint = result.standard.sprints[0]
  if (firstSprint) {
    markers.push({
      xLabel: format(firstSprint.startDate, "M/d"),
      markerLabel: sorted[0].label || `vel=${sorted[0].velocity}`,
      isFirst: true,
    })
  }

  // フェーズ2以降は切り替え日以降の最初のスプリント開始位置にラベルを置く
  for (let p = 1; p < sorted.length; p++) {
    const phaseDate = sorted[p].fromDate
    for (let i = 0; i < result.standard.sprints.length; i++) {
      const sprint = result.standard.sprints[i]
      if (sprint.startDate >= phaseDate) {
        markers.push({
          xLabel: format(sprint.startDate, "M/d"),
          markerLabel: sorted[p].label || `vel=${sorted[p].velocity}`,
          isFirst: false,
        })
        break
      }
    }
  }
  return markers
}

export function BurndownChart({ result, velocityPhases, deadline, completedSprints, totalPoints }: BurndownChartProps) {
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const { theme } = useTheme()
  const isDark = theme === "dark"

  const tickColor = isDark ? "#a1a1aa" : "#666666"
  const gridColor = isDark ? "#ffffff1a" : "#cccccc"
  const tooltipStyle = isDark
    ? { background: "#1e1e2e", border: "1px solid #3f3f5a", color: "#e4e4f0" }
    : {}
  const todayLineColor = isDark ? "#94a3b8" : "#64748b"
  const deadlineLineColor = "#ef4444"
  const phaseLineColor = "#8b5cf6"
  const todayDotFill = "#3b82f6"

  const today = new Date()
  const deadlineDate = deadline ? parseISO(deadline) : undefined
  const data = buildChartData(result, today, deadlineDate, completedSprints, totalPoints)
  const phaseMarkers = findPhaseChangeMarkers(result, velocityPhases)

  // 遅延日数計算
  const hasActual = completedSprints && completedSprints.length > 0 && totalPoints !== undefined
  const sprintDaysNum = result.standard.sprints[0]
    ? Math.round(
        (result.standard.sprints[0].endDate.getTime() -
          result.standard.sprints[0].startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 14
  const delayDays = hasActual
    ? calculateDelayDays(totalPoints!, completedSprints!, result.standard, sprintDaysNum)
    : null

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
        <div className="flex items-center gap-3 flex-wrap">
          <CardTitle className="text-base">バーンダウンチャート</CardTitle>
          {delayDays !== null && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                delayDays > 0
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : delayDays < 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {delayDays > 0
                ? `遅延: ${delayDays}日`
                : delayDays < 0
                ? `前倒し: ${Math.abs(delayDays)}日`
                : "予定通り"}
            </span>
          )}
          {idealRemaining !== null && (
            <span className="ml-auto text-xs text-muted-foreground">
              今日の理想残: <strong className="text-foreground">{idealRemaining} pt</strong>
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[350px] w-full">
          {isMounted && <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
              <XAxis
                dataKey="label"
                fontSize={11}
                angle={-35}
                textAnchor="end"
                height={50}
                tick={{ fontSize: 11, fill: tickColor }}
              />
              <YAxis
                fontSize={12}
                label={{
                  value: "残り pt",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fontSize: 11,
                  fill: tickColor,
                }}
                tick={{ fill: tickColor }}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  fontSize: "12px",
                  ...tooltipStyle,
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
                  stroke={todayLineColor}
                  strokeDasharray="6 3"
                  label={{
                    value: "今日",
                    position: "top",
                    fontSize: 11,
                    fill: todayLineColor,
                  }}
                />
              )}

              {todayLabel && idealRemaining !== null && (
                <ReferenceDot
                  x={todayLabel}
                  y={idealRemaining}
                  r={6}
                  fill={todayDotFill}
                  stroke={isDark ? "#1e1e2e" : "white"}
                  strokeWidth={2}
                />
              )}

              {deadlineLabel && (
                <ReferenceLine
                  x={deadlineLabel}
                  stroke={deadlineLineColor}
                  strokeDasharray="6 3"
                  label={{
                    value: `DL: ${deadlineLabel}`,
                    position: "top",
                    fontSize: 11,
                    fill: deadlineLineColor,
                  }}
                />
              )}

              {phaseMarkers.map((marker, index) => (
                <ReferenceLine
                  key={marker.xLabel}
                  x={marker.xLabel}
                  stroke={phaseLineColor}
                  strokeWidth={marker.isFirst ? 1 : 2}
                  strokeDasharray={marker.isFirst ? "4 4" : undefined}
                  label={
                    marker.isFirst
                      ? undefined
                      : ({ viewBox }: { viewBox?: { x?: number; y?: number } }) => {
                          const x = viewBox?.x ?? 0
                          const y = viewBox?.y ?? 0
                          // 偶数インデックス: 上寄り、奇数インデックス: やや下にずらして重なりを防ぐ
                          const yPos = index % 2 === 0 ? y - 14 : y + 2
                          return (
                            <text
                              x={x}
                              y={yPos}
                              textAnchor="middle"
                              fill={phaseLineColor}
                              fontSize={11}
                            >
                              {marker.markerLabel}
                            </text>
                          )
                        }
                  }
                />
              ))}

              <Area
                type="monotone"
                dataKey="lowVelocity"
                name="不調"
                stroke="#f97316"
                fill="#fed7aa"
                fillOpacity={0.3}
                strokeWidth={2}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="standard"
                name="標準"
                stroke="#3b82f6"
                fill="#bfdbfe"
                fillOpacity={0.3}
                strokeWidth={2}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="highVelocity"
                name="好調"
                stroke="#22c55e"
                fill="#bbf7d0"
                fillOpacity={0.3}
                strokeWidth={2}
                connectNulls
              />
              {hasActual && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="実績"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ef4444", stroke: "white", strokeWidth: 1.5 }}
                  connectNulls={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>}
        </div>
      </CardContent>
    </Card>
  )
}
