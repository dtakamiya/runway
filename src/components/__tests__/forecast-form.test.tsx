import { render, screen } from "@testing-library/react"
import { ForecastForm } from "../forecast-form"

const defaultData = {
  totalPoints: "100",
  startDate: "2026-03-10",
  sprintDays: "14",
  bufferPercent: "20",
}

describe("ForecastForm", () => {
  it("バッファーの説明テキストが簡潔に表示される", () => {
    render(<ForecastForm data={defaultData} onChange={() => {}} />)
    const hint = screen.getByText(/vel -20%/)
    expect(hint).toBeInTheDocument()
    // 長い説明文が使われていないことを確認
    expect(screen.queryByText(/低下し、総ポイントが/)).not.toBeInTheDocument()
  })

  it("バッファー0の場合、説明テキストが非表示", () => {
    const data = { ...defaultData, bufferPercent: "0" }
    render(<ForecastForm data={data} onChange={() => {}} />)
    expect(screen.queryByText(/vel/)).not.toBeInTheDocument()
  })
})
