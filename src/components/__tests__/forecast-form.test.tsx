import { render, screen } from "@testing-library/react"
import { ForecastForm } from "../forecast-form"

const defaultData = {
  totalPoints: "100",
  startDate: "2026-03-10",
  sprintDays: "14",
  bufferPercent: "20",
  deadline: "",
}

describe("ForecastForm", () => {
  it("バッファーの説明テキストが表示される", () => {
    render(<ForecastForm data={defaultData} onChange={() => {}} />)
    expect(screen.getByText(/不調シナリオでは、ベロシティを/)).toBeInTheDocument()
    expect(screen.getByText(/低下させて計算します/)).toBeInTheDocument()
  })

  it("バッファー0の場合、説明テキストが非表示", () => {
    const data = { ...defaultData, bufferPercent: "0" }
    render(<ForecastForm data={data} onChange={() => {}} />)
    expect(screen.queryByText(/vel/)).not.toBeInTheDocument()
  })

  it("デッドラインの入力フィールドが存在する", () => {
    render(<ForecastForm data={defaultData} onChange={() => {}} />)
    expect(screen.getByLabelText("デッドライン (任意)")).toBeInTheDocument()
  })
})
