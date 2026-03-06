import { calcVelocityStats } from "../velocity-stats"

describe("calcVelocityStats", () => {
  it("平均値を正しく計算する", () => {
    const stats = calcVelocityStats([10, 20, 30])
    expect(stats.average).toBe(20)
  })

  it("標準偏差を正しく計算する", () => {
    // [10, 20, 30] の標準偏差 = sqrt(((10-20)^2 + (20-20)^2 + (30-20)^2) / 3) = sqrt(200/3) ≈ 8.16
    const stats = calcVelocityStats([10, 20, 30])
    expect(stats.stdDev).toBeCloseTo(8.16, 1)
  })

  it("単一値の場合、平均=その値、stdDev=0", () => {
    const stats = calcVelocityStats([15])
    expect(stats.average).toBe(15)
    expect(stats.stdDev).toBe(0)
  })

  it("空配列の場合は average=0, stdDev=0 を返す", () => {
    const stats = calcVelocityStats([])
    expect(stats.average).toBe(0)
    expect(stats.stdDev).toBe(0)
  })

  it("小数点の平均値は小数第1位で丸める", () => {
    // [10, 11] の平均 = 10.5
    const stats = calcVelocityStats([10, 11])
    expect(stats.average).toBe(10.5)
  })

  it("最大・最小値を返す", () => {
    const stats = calcVelocityStats([5, 15, 25, 10])
    expect(stats.min).toBe(5)
    expect(stats.max).toBe(25)
  })

  it("スプリント数を返す", () => {
    const stats = calcVelocityStats([10, 20, 30])
    expect(stats.count).toBe(3)
  })
})
