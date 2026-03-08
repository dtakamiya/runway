import { findPhaseChangeMarkers, buildChartData, buildBaseDataPoints, collectSpecialPoints } from "../burndown-chart"
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
  return { highVelocity: scenario, standard: scenario, lowVelocity: scenario }
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
    return { highVelocity: scenario, standard: scenario, lowVelocity: scenario }
  }

  it("スプリント数 + 1 個のデータポイントのみを返す（今日・DL は挿入しない）", () => {
    const result = makeResultWithPoints(sprints)
    const today = new Date("2025-04-14") // S1 の途中
    const deadline = new Date("2025-04-30") // S2 の途中

    const data = buildChartData(result, today, deadline)

    // 開始点 + 3スプリント = 4点のみ
    expect(data).toHaveLength(sprints.length + 1)
    expect(data.find((d) => d.sprintNum === "今日")).toBeUndefined()
    expect(data.find((d) => d.sprintNum === "DL")).toBeUndefined()
  })

  it("各データポイントに date (timestamp) が設定される", () => {
    const result = makeResultWithPoints(sprints)
    const data = buildChartData(result, new Date("2025-04-01"))

    // 開始点は S1 の startDate
    expect(data[0].date).toBe(new Date("2025-04-07").getTime())
    // S1 は S1 の endDate
    expect(data[1].date).toBe(new Date("2025-04-21").getTime())
    // S2 は S2 の endDate
    expect(data[2].date).toBe(new Date("2025-05-05").getTime())
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

  it("フェーズ開始日がスプリント開始日と一致するとき、全フェーズのマーカーを置く", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [
      { fromDate: new Date("2025-03-20"), velocity: 10 },
      { fromDate: new Date("2025-04-03"), velocity: 15, label: "phase2" }, // S2開始日と一致
    ]

    const markers = findPhaseChangeMarkers(result, phases)

    // フェーズ1（3/20）とフェーズ2（4/3）の両方にマーカーが置かれる
    expect(markers).toHaveLength(2)
    expect(markers[0].xTs).toBe(new Date("2025-03-20").getTime())
    expect(markers[0].markerLabel).toBe("vel=10")
    expect(markers[1].xTs).toBe(new Date("2025-04-03").getTime())
    expect(markers[1].markerLabel).toBe("phase2")
  })

  it("フェーズ開始日がスプリント中間にあるとき、フェーズ1は最初のスプリント開始日、フェーズ2以降は切り替え後のスプリント開始日にマーカーを置く", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [
      { fromDate: new Date("2025-03-20"), velocity: 10 },
      { fromDate: new Date("2025-04-10"), velocity: 20 }, // S2の途中
    ]

    const markers = findPhaseChangeMarkers(result, phases)

    // フェーズ1は3/20、4/10はS2の途中 → フェーズ2はS3開始日(4/17)にマーカー
    expect(markers).toHaveLength(2)
    expect(markers[0].xTs).toBe(new Date("2025-03-20").getTime())
    expect(markers[1].xTs).toBe(new Date("2025-04-17").getTime())
  })

  it("フェーズが1つのとき、マーカーは空", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [{ fromDate: new Date("2025-03-20"), velocity: 10 }]

    const markers = findPhaseChangeMarkers(result, phases)

    expect(markers).toHaveLength(0)
  })

  it("labelがない場合、全フェーズでvel=<velocity>の形式でmarkerLabelを生成する", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [
      { fromDate: new Date("2025-03-20"), velocity: 10 },
      { fromDate: new Date("2025-04-03"), velocity: 15 },
    ]

    const markers = findPhaseChangeMarkers(result, phases)

    expect(markers[0].markerLabel).toBe("vel=10")
    expect(markers[1].markerLabel).toBe("vel=15")
  })

  it("3フェーズある場合、全フェーズにマーカーを置く", () => {
    const result = makeResult(sprints)
    const phases: VelocityPhase[] = [
      { fromDate: new Date("2025-03-20"), velocity: 10 },
      { fromDate: new Date("2025-04-03"), velocity: 20 },
      { fromDate: new Date("2025-04-17"), velocity: 30 },
    ]

    const markers = findPhaseChangeMarkers(result, phases)

    expect(markers).toHaveLength(3)
    expect(markers[0].xTs).toBe(new Date("2025-03-20").getTime())
    expect(markers[0].markerLabel).toBe("vel=10")
    expect(markers[1].xTs).toBe(new Date("2025-04-03").getTime())
    expect(markers[1].markerLabel).toBe("vel=20")
    expect(markers[2].xTs).toBe(new Date("2025-04-17").getTime())
    expect(markers[2].markerLabel).toBe("vel=30")
  })
})

// ── buildBaseDataPoints ────────────────────────────────────────────────────────

describe("buildBaseDataPoints", () => {
  const sprints = [
    { startDate: new Date("2025-04-07"), endDate: new Date("2025-04-21") },
    { startDate: new Date("2025-04-21"), endDate: new Date("2025-05-05") },
    { startDate: new Date("2025-05-05"), endDate: new Date("2025-05-19") },
  ]

  function makeResultWithPoints(sprintDefs: { startDate: Date; endDate: Date }[]): ForecastResult {
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
    return { highVelocity: scenario, standard: scenario, lowVelocity: scenario }
  }

  it("最初の要素が開始点（sprintNum: '開始'）", () => {
    const result = makeResultWithPoints(sprints)
    const data = buildBaseDataPoints(result, new Map())
    expect(data[0].sprintNum).toBe("開始")
  })

  it("スプリント数 + 1 個のデータポイントを返す", () => {
    const result = makeResultWithPoints(sprints)
    const data = buildBaseDataPoints(result, new Map())
    expect(data).toHaveLength(sprints.length + 1)
  })

  it("実績マップにある索引のポイントにactualが設定される", () => {
    const result = makeResultWithPoints(sprints)
    const actualMap = new Map([[0, 100], [1, 65]])
    const data = buildBaseDataPoints(result, actualMap)
    expect(data[0].actual).toBe(100) // 開始点 (index 0)
    expect(data[1].actual).toBe(65)  // S1 (index 1)
    expect(data[2].actual).toBeUndefined() // S2 なし
  })

  it("スプリントのendDateがlabelとして使われる", () => {
    const result = makeResultWithPoints(sprints)
    const data = buildBaseDataPoints(result, new Map())
    expect(data[1].label).toBe("4/21") // S1 終了日
  })

  it("各データポイントに date (timestamp) が設定される", () => {
    const result = makeResultWithPoints(sprints)
    const data = buildBaseDataPoints(result, new Map())
    expect(data[0].date).toBe(new Date("2025-04-07").getTime()) // 開始点
    expect(data[1].date).toBe(new Date("2025-04-21").getTime()) // S1 終了日
    expect(data[2].date).toBe(new Date("2025-05-05").getTime()) // S2 終了日
  })
})

// ── collectSpecialPoints ───────────────────────────────────────────────────────

describe("collectSpecialPoints", () => {
  const sprints = [
    { startDate: new Date("2025-04-07"), endDate: new Date("2025-04-21") },
    { startDate: new Date("2025-04-21"), endDate: new Date("2025-05-05") },
    { startDate: new Date("2025-05-05"), endDate: new Date("2025-05-19") },
  ]

  function makeResultFlat(): ForecastResult {
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
      endDate: sprints[sprints.length - 1].endDate,
      sprints: sprintBreakdowns,
    }
    return { highVelocity: scenario, standard: scenario, lowVelocity: scenario }
  }

  it("todayがスプリント範囲内なら「今日」を含む", () => {
    const result = makeResultFlat()
    const points = collectSpecialPoints(result, new Date("2025-04-14"))
    expect(points.some((p) => p.sprintNum === "今日")).toBe(true)
  })

  it("todayがスプリント範囲外なら「今日」を含まない", () => {
    const result = makeResultFlat()
    const points = collectSpecialPoints(result, new Date("2025-06-01"))
    expect(points.some((p) => p.sprintNum === "今日")).toBe(false)
  })

  it("deadlineがスプリント範囲内なら「DL」を含む", () => {
    const result = makeResultFlat()
    const points = collectSpecialPoints(result, new Date("2025-04-01"), new Date("2025-04-30"))
    expect(points.some((p) => p.sprintNum === "DL")).toBe(true)
  })

  it("deadlineがスプリント範囲外なら「DL」を含まない", () => {
    const result = makeResultFlat()
    const points = collectSpecialPoints(result, new Date("2025-04-01"), new Date("2025-06-01"))
    expect(points.some((p) => p.sprintNum === "DL")).toBe(false)
  })

  it("複数の特殊ポイントが日付昇順にソートされる", () => {
    const result = makeResultFlat()
    const points = collectSpecialPoints(result, new Date("2025-04-14"), new Date("2025-04-30"))
    expect(points.length).toBe(2)
    expect(points[0].date.getTime()).toBeLessThanOrEqual(points[1].date.getTime())
  })
})
