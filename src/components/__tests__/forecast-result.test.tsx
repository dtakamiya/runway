import { render, screen } from "@testing-library/react"
import { ForecastResultCards } from "../forecast-result"
import type { ForecastResult } from "@/lib/types"

const mockResult: ForecastResult = {
  highVelocity: {
    sprintCount: 4,
    totalPoints: 100,
    endDate: new Date("2026-05-05"),
    sprints: [],
  },
  standard: {
    sprintCount: 5,
    totalPoints: 100,
    endDate: new Date("2026-05-19"),
    sprints: [],
  },
  lowVelocity: {
    sprintCount: 7,
    totalPoints: 100,
    endDate: new Date("2026-06-16"),
    sprints: [],
  },
}

describe("ForecastResultCards", () => {
  it("標準カードに強調スタイル（ring）が適用される", () => {
    const { container } = render(<ForecastResultCards result={mockResult} />)
    const standardCard = container.querySelector("[data-scenario='standard']")
    expect(standardCard?.className).toMatch(/ring/)
  })

  it("好調シナリオに TrendingUp アイコンが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    expect(screen.getByTestId("icon-highVelocity")).toBeInTheDocument()
  })

  it("標準シナリオに Minus アイコンが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    expect(screen.getByTestId("icon-standard")).toBeInTheDocument()
  })

  it("不調シナリオに TrendingDown アイコンが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    expect(screen.getByTestId("icon-lowVelocity")).toBeInTheDocument()
  })

  it("3つのシナリオカードが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    expect(screen.getByText("好調")).toBeInTheDocument()
    expect(screen.getByText("標準")).toBeInTheDocument()
    expect(screen.getByText("不調")).toBeInTheDocument()
  })

  describe("デッドライン表示", () => {
    it("デッドラインなしの場合はステータスバッジが表示されない", () => {
      render(<ForecastResultCards result={mockResult} />)
      expect(screen.queryByText(/間に合う/)).not.toBeInTheDocument()
      expect(screen.queryByText(/日超過/)).not.toBeInTheDocument()
    })

    it("全シナリオがデッドライン内に収まる場合、全カードに「間に合う」が表示される", () => {
      render(
        <ForecastResultCards result={mockResult} deadline="2026-12-31" />
      )
      const badges = screen.getAllByText("間に合う")
      expect(badges).toHaveLength(3)
    })

    it("全シナリオがデッドラインを超える場合、全カードに「日超過」が表示される", () => {
      render(
        <ForecastResultCards result={mockResult} deadline="2026-04-01" />
      )
      const badges = screen.getAllByText(/日超過/)
      expect(badges).toHaveLength(3)
    })

    it("一部シナリオがデッドラインを超える場合、正しく混在表示される", () => {
      // 好調(05/05)と標準(05/19)はOK、不調(06/16)はアウト
      render(
        <ForecastResultCards result={mockResult} deadline="2026-05-20" />
      )
      const onTime = screen.getAllByText("間に合う")
      const over = screen.getAllByText(/日超過/)
      expect(onTime).toHaveLength(2)
      expect(over).toHaveLength(1)
    })

    it("超過日数が正確に表示される", () => {
      // 好調(05/05)は2026-05-01より4日後 → 4日超過
      render(
        <ForecastResultCards result={mockResult} deadline="2026-05-01" />
      )
      expect(screen.getByText("4日超過")).toBeInTheDocument()
    })
  })
})
