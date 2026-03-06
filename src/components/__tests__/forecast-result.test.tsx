import { render, screen } from "@testing-library/react"
import { ForecastResultCards } from "../forecast-result"
import type { ForecastResult } from "@/lib/types"

const mockResult: ForecastResult = {
  optimistic: {
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
  pessimistic: {
    sprintCount: 7,
    totalPoints: 120,
    endDate: new Date("2026-06-16"),
    sprints: [],
  },
}

describe("ForecastResultCards", () => {
  it("標準カードに強調スタイル（ring）が適用される", () => {
    const { container } = render(<ForecastResultCards result={mockResult} />)
    const cards = container.querySelectorAll("[data-scenario]")
    const standardCard = container.querySelector("[data-scenario='standard']")
    expect(standardCard?.className).toMatch(/ring/)
  })

  it("楽観シナリオに TrendingUp アイコンが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    // lucide-react icons render as SVG with aria-label or data attributes
    expect(screen.getByTestId("icon-optimistic")).toBeInTheDocument()
  })

  it("標準シナリオに Minus アイコンが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    expect(screen.getByTestId("icon-standard")).toBeInTheDocument()
  })

  it("悲観シナリオに TrendingDown アイコンが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    expect(screen.getByTestId("icon-pessimistic")).toBeInTheDocument()
  })

  it("3つのシナリオカードが表示される", () => {
    render(<ForecastResultCards result={mockResult} />)
    expect(screen.getByText("楽観")).toBeInTheDocument()
    expect(screen.getByText("標準")).toBeInTheDocument()
    expect(screen.getByText("悲観")).toBeInTheDocument()
  })
})
