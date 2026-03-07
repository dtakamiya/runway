import { render, screen, fireEvent } from "@testing-library/react"
import { VelocityHistory } from "../velocity-history"

describe("VelocityHistory", () => {
  it("コンポーネントが表示される", () => {
    render(<VelocityHistory onApply={() => {}} />)
    expect(
      screen.getByPlaceholderText(/例: 20, 18, 22, 25/)
    ).toBeInTheDocument()
  })

  it("visible label が表示される", () => {
    render(<VelocityHistory onApply={() => {}} />)
    expect(screen.getByText("過去スプリントのベロシティ")).toBeInTheDocument()
  })

  it("label が input と htmlFor/id で紐付いている", () => {
    render(<VelocityHistory onApply={() => {}} />)
    const input = screen.getByLabelText("過去スプリントのベロシティ")
    expect(input).toBeInTheDocument()
  })

  it("数値を入力すると統計が表示される", () => {
    render(<VelocityHistory onApply={() => {}} />)
    const input = screen.getByPlaceholderText(/例: 20, 18, 22, 25/)
    fireEvent.change(input, { target: { value: "10, 20, 30" } })
    expect(screen.getByText(/平均/)).toBeInTheDocument()
    expect(screen.getByText("20")).toBeInTheDocument()
  })

  it("「この値を使う」ボタンが平均値で onApply を呼ぶ", () => {
    const onApply = jest.fn()
    render(<VelocityHistory onApply={onApply} />)
    const input = screen.getByPlaceholderText(/例: 20, 18, 22, 25/)
    fireEvent.change(input, { target: { value: "10, 20, 30" } })
    fireEvent.click(screen.getByText("この値を使う"))
    expect(onApply).toHaveBeenCalledWith(20)
  })

  it("無効な入力の場合はボタンが無効化される", () => {
    render(<VelocityHistory onApply={() => {}} />)
    const button = screen.getByText("この値を使う")
    expect(button).toBeDisabled()
  })

  it("スプリント数と最大/最小を表示する", () => {
    render(<VelocityHistory onApply={() => {}} />)
    const input = screen.getByPlaceholderText(/例: 20, 18, 22, 25/)
    fireEvent.change(input, { target: { value: "5, 15, 25" } })
    // 各ラベルの次の要素で確認
    expect(screen.getByText("スプリント数")).toBeInTheDocument()
    expect(screen.getByText("最小")).toBeInTheDocument()
    expect(screen.getByText("最大")).toBeInTheDocument()
    // 値の確認
    const allText = screen.getByText("5") // min=5
    expect(allText).toBeInTheDocument()
  })
})
