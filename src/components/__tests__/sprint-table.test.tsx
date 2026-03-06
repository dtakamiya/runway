import { render, screen } from "@testing-library/react"
import { SprintTable } from "../sprint-table"
import type { ForecastResult } from "@/lib/types"

const mockSprint = {
  sprintNumber: 1,
  startDate: new Date("2026-03-10"),
  endDate: new Date("2026-03-24"),
  velocity: 15,
  pointsBurned: 15,
  remainingPoints: 85,
}

const mockResult: ForecastResult = {
  optimistic: { sprintCount: 4, totalPoints: 100, endDate: new Date("2026-05-05"), sprints: [mockSprint] },
  standard: { sprintCount: 5, totalPoints: 100, endDate: new Date("2026-05-19"), sprints: [mockSprint] },
  pessimistic: { sprintCount: 7, totalPoints: 120, endDate: new Date("2026-06-16"), sprints: [mockSprint] },
}

describe("SprintTable", () => {
  it("タブラベルに「スプリント」と表示される（英語の Sprint ではない）", () => {
    render(<SprintTable result={mockResult} />)
    const tabs = screen.getAllByRole("tab")
    tabs.forEach((tab) => {
      expect(tab.textContent).not.toMatch(/\bSprint\b/)
      expect(tab.textContent).toMatch(/スプリント/)
    })
  })
})
