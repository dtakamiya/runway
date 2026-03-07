import { render, screen, fireEvent } from "@testing-library/react"
import { VelocityPhases, type PhaseFormData } from "../velocity-phases"

const makePhase = (overrides: Partial<PhaseFormData> = {}): PhaseFormData => ({
  id: "phase-1",
  fromDate: "2026-03-10",
  velocity: "20",
  label: "テストフェーズ",
  ...overrides,
})

describe("VelocityPhases - フェーズ追加時のデフォルト値", () => {
  it("追加フェーズのベロシティが前フェーズと同値になる", () => {
    const phases = [makePhase({ velocity: "25" })]
    const handleChange = jest.fn()
    render(<VelocityPhases phases={phases} onChange={handleChange} sprintDays={14} />)

    fireEvent.click(screen.getByText("フェーズを追加"))

    expect(handleChange).toHaveBeenCalledTimes(1)
    const newPhases: PhaseFormData[] = handleChange.mock.calls[0][0]
    expect(newPhases[1].velocity).toBe("25")
  })

  it("sprintDaysが指定された場合、変更日が前フェーズ日付 + sprintDays×2になる", () => {
    const phases = [makePhase({ fromDate: "2026-03-10" })]
    const handleChange = jest.fn()
    render(<VelocityPhases phases={phases} onChange={handleChange} sprintDays={14} />)

    fireEvent.click(screen.getByText("フェーズを追加"))

    const newPhases: PhaseFormData[] = handleChange.mock.calls[0][0]
    // 2026-03-10 + 28日 = 2026-04-07
    expect(newPhases[1].fromDate).toBe("2026-04-07")
  })

  it("sprintDaysが7の場合、変更日が前フェーズ日付 + 14日になる", () => {
    const phases = [makePhase({ fromDate: "2026-03-10" })]
    const handleChange = jest.fn()
    render(<VelocityPhases phases={phases} onChange={handleChange} sprintDays={7} />)

    fireEvent.click(screen.getByText("フェーズを追加"))

    const newPhases: PhaseFormData[] = handleChange.mock.calls[0][0]
    // 2026-03-10 + 14日 = 2026-03-24
    expect(newPhases[1].fromDate).toBe("2026-03-24")
  })

  it("sprintDaysが未指定の場合、変更日が空になる", () => {
    const phases = [makePhase({ fromDate: "2026-03-10" })]
    const handleChange = jest.fn()
    render(<VelocityPhases phases={phases} onChange={handleChange} />)

    fireEvent.click(screen.getByText("フェーズを追加"))

    const newPhases: PhaseFormData[] = handleChange.mock.calls[0][0]
    expect(newPhases[1].fromDate).toBe("")
  })

  it("前フェーズの日付が空の場合、変更日が空になる", () => {
    const phases = [makePhase({ fromDate: "" })]
    const handleChange = jest.fn()
    render(<VelocityPhases phases={phases} onChange={handleChange} sprintDays={14} />)

    fireEvent.click(screen.getByText("フェーズを追加"))

    const newPhases: PhaseFormData[] = handleChange.mock.calls[0][0]
    expect(newPhases[1].fromDate).toBe("")
  })
})
