import { render, screen, fireEvent, act } from "@testing-library/react"
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

  it("「この値を使う」クリック後に計算結果が自動更新され、再計算メッセージが表示されない", () => {
    render(<Home />)
    // 先に計算を実行して結果を表示
    fireEvent.click(screen.getByText("予測を計算"))
    expect(screen.queryByText(/「予測を計算」を押すと/)).not.toBeInTheDocument()

    // 「過去のベロシティから計算」セクションを展開
    fireEvent.click(screen.getByText("過去のベロシティから計算"))

    // ベロシティ履歴を入力
    const historyInput = screen.getByLabelText("過去スプリントのベロシティ")
    fireEvent.change(historyInput, { target: { value: "20, 25, 30" } })

    // 「この値を使う」をクリック
    fireEvent.click(screen.getByText("この値を使う"))

    // 計算結果が消えていない（プレースホルダーが表示されていない）
    expect(screen.queryByText(/「予測を計算」を押すと/)).not.toBeInTheDocument()

    // 「再計算してください」メッセージが表示されない
    expect(screen.queryByText(/再計算してください/)).not.toBeInTheDocument()
  })

  describe("URLをコピーボタン（handleShare）", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        writable: true,
        value: { writeText: jest.fn() },
      })
    })

    it("クリップボード成功時、コピーしました！が表示される", async () => {
      jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)
      render(<Home />)
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /URLをコピー/ }))
      })
      expect(screen.getByText("コピーしました！")).toBeInTheDocument()
    })

    it("クリップボードが失敗しても画面がクラッシュせず元の状態を保つ", async () => {
      jest.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("NotAllowedError"))
      render(<Home />)
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /URLをコピー/ }))
      })
      expect(screen.queryByText("コピーしました！")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: /URLをコピー/ })).toBeInTheDocument()
    })
  })
})
