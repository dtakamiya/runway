import { findPhaseChangeMarkers, buildChartData } from "../burndown-chart"
import type { ForecastResult, VelocityPhase } from "@/lib/types"

// recharts はコンポーネントのみ使用するためモック不要（関数のみテスト）
jest.mock("recharts", () => ({}))
jest.mock("@/components/ui/card", () => ({}))
jest.mock("@/lib/forecast", () => ({ getIdealRemainingAtDate: jest.fn() }))

function makeResult(sprints: { startDate: Date; endDate: Date }[]): ForecastResult {
  const sprintBreakdowns = sprints.map((s, i) => ({
    sprintNumber: i + 1,
    velocity: 10,
    pointsBurned: 10,
    remainingPoints: 100 - (i + 1) * 10,
    startDate: s.startDate,
    endDate: s.endDate,
  }))
  const scenario = {
    totalPoints: 100,
    sprintCount: sprints.length,
    endDate: sprints[sprints.length - 1]?.endDate ?? new Date(),
    sprints: sprintBreakdowns,
  }
  return { optimistic: scenario, standard: scenario, pessimistic: scenario }
}

describe("buildChartData", () => {
  // スプリント設定:
  // S1: 4/7 〜 4/21
  // S2: 4/21 〜 5/5
  // S3: 5/5  〜 5/19
  const sprints = [
    { startDate: new Date("2025-04-07"), endDate: new Date("2025-04-21") },
    { startDate: new Date("2025-04-21"), endDate: new Date("2025-05-05") },
    { startDate: new Date("2025-05-05"), endDate: new Date("2025-05-19") },
  ]

  function makeResultWithPoints(
    sprintDefs: { startDate: Date; endDate: Date }[]
  ): ForecastResult {
    const totalPoints = 100
    const burnPerSprint = Math.floor(totalPoints / sprintDefs.length)
    const sprintBreakdowns = sprintDefs.map((s, i) => ({
      sprintNumber: i + 1,
      velocity: burnPerSprint,
      pointsBurned: burnPerSprint,
      remainingPoints: totalPoints - (i + 1) * burnPerSprint,
      startDate: s.startDate,
      endDate: s.endDate,
    }))
    const scenario = {
      totalPoints,
      sprintCount: sprintDefs.length,
      endDate: sprintDefs[sprintDefs.length - 1]?.endDate ?? new Date(),
      sprints: sprintBreakdowns,
    }
    return { optimistic: scenario, standard: scenario, pessimistic: scenario }
  }

  it("デッドラインのデータポイントはシナリオ値が null になる", () => {
    const result = makeResultWithPoints(sprints)
    const today = new Date("2025-04-01") // スプリント範囲外
    const deadline = new Date("2025-04-30") // S2 の途中

    const data = buildChartData(result, today, deadline)

    const dlPoint = data.find((d) => d.sprintNum === "DL")
    expect(dlPoint).toBeDefined()
    expect(dlPoint?.optimistic).toBeNull()
    expect(dlPoint?.standard).toBeNull()
    expect(dlPoint?.pessimistic).toBeNull()
    expect(dlPoint?.label).toBe("4/30")
  })

  it("今日のデータポイントはシナリオ値が null になる", () => {
    const result = makeResultWithPoints(sprints)
    const today = new Date("2025-04-14") // S1 の途中

    const data = buildChartData(result, today)

    const todayPoint = data.find((d) => d.sprintNum === "今日")
    expect(todayPoint).toBeDefined()
    expect(todayPoint?.optimistic).toBeNull()
    expect(todayPoint?.standard).toBeNull()
    expect(todayPoint?.pessimistic).toBeNull()
  })

  it("デッドラインがスプリント範囲外の場合、DL データポイントが追加されない", () => {
    const result = makeResultWithPoints(sprints)
    const today = new Date("2025-04-01")
    const deadline = new Date("2025-06-01") // 全スプリント終了後

    const data = buildChartData(result, today, deadline)

    const dlPoint = data.find((d) => d.sprintNum === "DL")
    expect(dlPoint).toBeUndefined()
  })

  it("デッドラインがスプリント終了日と同じラベルの場合、重複挿入されない", () => {
    const result = makeResultWithPoints(sprints)
    const today = new Date("2025-04-01")
    const deadline = new Date("2025-04-21") // S1 の終了日と同じ

    const data = buildChartData(result, today, deadline)

    const count = data.filter((d) => d.label === "4/21").length
    expect(count).toBe(1)
  })
})

describe("findPhaseChangeMarkers", () => {
  // スプリント設定:
  // S1: 3/20 〜 4/3
  // S2: 4/3  〜 4/17
  // S3: 4/17 〜 5/1
  const sprints = [
    { startDate: new Date("2025-03-20"), endDate: new Date("2025-04-03") },
    { startDate: new Date("2025-04-03"), endDate: new Date("2025-04-17") },
    { startDate: new Date("2025-04-17"), endDate: new Date("2025-05-01") },
  ]

  it("フェーズ開始日がスプリント開始日と一致するとき、そのスプリントの開始日にマーカーを置く", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [
      { fromDate: new Date("2025-03-20"), velocity: 10 },
      { fromDate: new Date("2025-04-03"), velocity: 15, label: "phase2" }, // S2開始日と一致
    ]

    const markers = findPhaseChangeMarkers(result, phases)

    expect(markers).toHaveLength(1)
    // マーカーはS2の開始日（= S1の終了日）= 4/3 に置かれるべき
    expect(markers[0].xLabel).toBe("4/3")
    expect(markers[0].markerLabel).toBe("phase2")
  })

  it("フェーズ開始日がスプリント中間にあるとき、そのスプリントの開始日にマーカーを置く", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [
      { fromDate: new Date("2025-03-20"), velocity: 10 },
      { fromDate: new Date("2025-04-10"), velocity: 20 }, // S2の途中
    ]

    const markers = findPhaseChangeMarkers(result, phases)

    // 4/10はS2の途中 → S3開始日(4/17)にマーカー
    expect(markers).toHaveLength(1)
    expect(markers[0].xLabel).toBe("4/17")
  })

  it("フェーズが1つのとき、マーカーは空", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [{ fromDate: new Date("2025-03-20"), velocity: 10 }]

    const markers = findPhaseChangeMarkers(result, phases)

    expect(markers).toHaveLength(0)
  })

  it("labelがない場合、vel=<velocity>の形式でmarkerLabelを生成する", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [
      { fromDate: new Date("2025-03-20"), velocity: 10 },
      { fromDate: new Date("2025-04-03"), velocity: 15 },
    ]

    const markers = findPhaseChangeMarkers(result, phases)

    expect(markers[0].markerLabel).toBe("vel=15")
  })
})
