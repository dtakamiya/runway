import { findPhaseChangeMarkers } from "../burndown-chart"
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
