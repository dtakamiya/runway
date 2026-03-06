import { render, screen, fireEvent } from "@testing-library/react"
import Home from "../page"

// recharts は jsdom 環境では動かないためモック
jest.mock("next/dynamic", () => () => {
  const MockChart = () => <div data-testid="burndown-chart" />
  MockChart.displayName = "MockChart"
  return MockChart
})

describe("Home (page)", () => {
  it("計算前に空状態のプレースホルダーが表示される", () => {
    render(<Home />)
    expect(screen.getByText(/「予測を計算」を押すと/)).toBeInTheDocument()
  })

  it("計算後にプレースホルダーが非表示になる", () => {
    render(<Home />)
    fireEvent.click(screen.getByText("予測を計算"))
    expect(screen.queryByText(/「予測を計算」を押すと/)).not.toBeInTheDocument()
  })

  it("値を変更後、ボタンに animate-pulse クラスが付く", () => {
    render(<Home />)
    // 計算してから値変更でisDirtyにする
    fireEvent.click(screen.getByText("予測を計算"))
    const input = screen.getByLabelText("ストーリーポイント合計")
    fireEvent.change(input, { target: { value: "200" } })
    const button = screen.getByRole("button", { name: "予測を計算" })
    expect(button.className).toMatch(/animate-pulse/)
  })

  it("ヘッダーにブランドロゴ要素が存在する", () => {
    render(<Home />)
    expect(screen.getByTestId("brand-logo")).toBeInTheDocument()
  })
})
