"use client"

import { useEffect, useRef, useState } from "react"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  readonly bufferPercent?: number
}

type ChartDataPoint = {
  readonly date: number // タイムスタンプ (XAxis の dataKey)
  readonly label: string
  readonly sprintNum: string
  readonly highVelocity: number | null | undefined
  readonly standard: number | null | undefined
  readonly lowVelocity: number | null | undefined
  readonly actual?: number | null
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
  const startTs = startDate ? startDate.getTime() : 0

  const data: ChartDataPoint[] = [
    {
      date: startTs,
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

    // X軸の日付は標準シナリオの終了日を優先、なければ不調シナリオの終了日
    const sprint = stdSprint ?? lowSprint
    const dateLabel = sprint ? format(sprint.endDate, "M/d") : `S${i + 1}`
    const dateTs = sprint ? sprint.endDate.getTime() : startTs + (i + 1) * 86400000
    const sprintIndex = i + 1

    data.push({
      date: dateTs,
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

type SpecialPoint = { date: Date; label: string; sprintNum: string }

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

  return buildBaseDataPoints(result, actualBySprintIndex)
}

export function findPhaseChangeMarkers(
  result: ForecastResult,
  phases: readonly VelocityPhase[]
): readonly { xTs: number; markerLabel: string; isFirst: boolean }[] {
  if (phases.length <= 1) return []
  const sorted = [...phases].sort(
    (a, b) => a.fromDate.getTime() - b.fromDate.getTime()
  )

  const markers: { xTs: number; markerLabel: string; isFirst: boolean }[] = []

  // フェーズ1（最初のフェーズ）は最初のスプリント開始位置に縦線のみ（ラベルなし）
  const firstSprint = result.standard.sprints[0]
  if (firstSprint) {
    markers.push({
      xTs: firstSprint.startDate.getTime(),
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
          xTs: sprint.startDate.getTime(),
          markerLabel: sorted[p].label || `vel=${sorted[p].velocity}`,
          isFirst: false,
        })
        break
      }
    }
  }
  return markers
}

export function BurndownChart({ result, velocityPhases, deadline, completedSprints, totalPoints, bufferPercent }: BurndownChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    obs.observe(el)
    return () => obs.disconnect()
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

  // バッファ0%のとき3シナリオが同一になるため1本のみ表示する
  const isSingleScenario = (bufferPercent ?? 0) === 0

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

  // 今日がスプリント範囲内かチェック
  const isTodayInSprints = result.standard.sprints.some(
    (s) => today >= s.startDate && today < s.endDate
  )
  const todayTs = isTodayInSprints ? today.getTime() : null

  // 今日時点の標準シナリオ理想残ポイント
  const idealRemainingRaw = isTodayInSprints
    ? getIdealRemainingAtDate(result.standard.sprints, today)
    : null
  const idealRemaining = idealRemainingRaw !== null ? Math.round(idealRemainingRaw) : null

  // デッドラインがスプリント範囲内かチェック
  const deadlineTs = deadlineDate && result.standard.sprints.some(
    (s) => deadlineDate >= s.startDate && deadlineDate < s.endDate
  )
    ? deadlineDate.getTime()
    : null

  // XAxis の ticks: スプリント開始点 + 各スプリント終了日
  const xTicks = data.map((d) => d.date)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <CardTitle className="text-base">バーンダウンチャート</CardTitle>
          {isSingleScenario && (
            <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
              バッファ0%: シナリオ差なし
            </span>
          )}
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
        <div ref={containerRef} className="h-[250px] sm:h-[350px] w-full">
          {size && <ComposedChart
            width={size.width}
            height={size.height}
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.5} />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={xTicks}
                tickFormatter={(ts: number) => format(new Date(ts), "M/d")}
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
                labelFormatter={(val, payload) => {
                  const ts = Number(val)
                  const sprintNum = (payload?.[0]?.payload as ChartDataPoint)?.sprintNum
                  const label = format(new Date(ts), "M/d")
                  return sprintNum ? `${sprintNum} (${label})` : label
                }}
              />
              <Legend />

              {todayTs !== null && (
                <ReferenceLine
                  x={todayTs}
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

              {todayTs !== null && idealRemaining !== null && (
                <ReferenceDot
                  x={todayTs}
                  y={idealRemaining}
                  r={6}
                  fill={todayDotFill}
                  stroke={isDark ? "#1e1e2e" : "white"}
                  strokeWidth={2}
                />
              )}

              {deadlineTs !== null && (
                <ReferenceLine
                  x={deadlineTs}
                  stroke={deadlineLineColor}
                  strokeDasharray="6 3"
                  label={{
                    value: `DL: ${format(new Date(deadlineTs), "M/d")}`,
                    position: "top",
                    fontSize: 11,
                    fill: deadlineLineColor,
                  }}
                />
              )}

              {phaseMarkers.map((marker, index) => (
                <ReferenceLine
                  key={marker.xTs}
                  x={marker.xTs}
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

              {!isSingleScenario && (
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
              )}
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
              {!isSingleScenario && (
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
              )}
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
          </ComposedChart>}
        </div>
      </CardContent>
    </Card>
  )
}
