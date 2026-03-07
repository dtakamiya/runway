import { render, screen, fireEvent, act } from "@testing-library/react"
import Home from "../page"

// recharts は jsdom 環境では動かないためモック
jest.mock("next/dynamic", () => () => {
  const MockChart = () => <div data-testid="burndown-chart" />
  MockChart.displayName = "MockChart"
  return MockChart
})

describe("Home (page)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("計算前に空状態のプレースホルダーが表示される", () => {
    render(<Home />)
    expect(screen.getByText(/完了予測を確認しましょう/)).toBeInTheDocument()
  })

  it("計算後にプレースホルダーが非表示になる", () => {
    render(<Home />)
    fireEvent.click(screen.getByText("予測を計算"))
    expect(screen.queryByText(/完了予測を確認しましょう/)).not.toBeInTheDocument()
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
    expect(screen.queryByText(/完了予測を確認しましょう/)).not.toBeInTheDocument()

    // 「過去のベロシティから計算」セクションを展開
    fireEvent.click(screen.getByText("過去のベロシティから計算"))

    // ベロシティ履歴を入力
    const historyInput = screen.getByLabelText("過去スプリントのベロシティ")
    fireEvent.change(historyInput, { target: { value: "20, 25, 30" } })

    // 「この値を使う」をクリック
    fireEvent.click(screen.getByText("この値を使う"))

    // 計算結果が消えていない（プレースホルダーが表示されていない）
    expect(screen.queryByText(/完了予測を確認しましょう/)).not.toBeInTheDocument()

    // 「再計算してください」メッセージが表示されない
    expect(screen.queryByText(/再計算してください/)).not.toBeInTheDocument()
  })

  describe("メッセージ優先度（issue#11）", () => {
    it("フォームバリデーションエラーがある場合、「値が変更されました」メッセージが非表示になる", () => {
      render(<Home />)
      // まず計算してisDirtyをfalseに
      fireEvent.click(screen.getByText("予測を計算"))

      // ストーリーポイントを負の値に変更（isDirty=true、バリデーションエラー発生条件を作る）
      const input = screen.getByLabelText("ストーリーポイント合計")
      fireEvent.change(input, { target: { value: "-10" } })

      // 予測を計算 → バリデーションエラーが表示される
      fireEvent.click(screen.getByText("予測を計算"))

      // バリデーションエラーが表示されている
      expect(screen.getByText(/ストーリーポイントの合計は正の数/)).toBeInTheDocument()

      // 「値が変更されました」メッセージは表示されない
      expect(screen.queryByText(/再計算してください/)).not.toBeInTheDocument()
    })

    it("velocityErrorがある場合、「値が変更されました」メッセージが非表示になる", () => {
      render(<Home />)
      // まず計算してisDirtyをfalseに
      fireEvent.click(screen.getByText("予測を計算"))

      // ストーリーポイントを-10に変更して計算 → formErrors発生
      const pointsInput = screen.getByLabelText("ストーリーポイント合計")
      fireEvent.change(pointsInput, { target: { value: "-10" } })
      fireEvent.click(screen.getByText("予測を計算"))

      // ストーリーポイントを100に戻す → formErrorsクリア、isDirty=true
      fireEvent.change(pointsInput, { target: { value: "100" } })

      // ベロシティを0に変更（placeholderで検索）
      const velocityInput = screen.getByPlaceholderText("15")
      fireEvent.change(velocityInput, { target: { value: "0" } })

      // 予測を計算 → velocityErrorが表示される
      fireEvent.click(screen.getByText("予測を計算"))

      // velocityErrorが表示されている
      expect(screen.getByText(/すべてのベロシティは正の数/)).toBeInTheDocument()

      // 「値が変更されました」メッセージは表示されない
      expect(screen.queryByText(/再計算してください/)).not.toBeInTheDocument()
    })

    it("エラーがない状態でisDirtyの場合、「値が変更されました」メッセージが表示される", () => {
      render(<Home />)
      // 計算してからストーリーポイントを変更
      fireEvent.click(screen.getByText("予測を計算"))
      const input = screen.getByLabelText("ストーリーポイント合計")
      fireEvent.change(input, { target: { value: "200" } })

      // 「値が変更されました」メッセージが表示される
      expect(screen.getByText(/再計算してください/)).toBeInTheDocument()
    })
  })

  describe("実績入力による予測更新（issue#92）", () => {
    it("実績スプリントを追加すると残ポイントで再計算された予測が表示される", () => {
      render(<Home />)
      // デフォルト設定 (100pt, velocity 15, buffer 20%) で計算
      fireEvent.click(screen.getByText("予測を計算"))
      // 計算直後は 100 pts が3シナリオすべてに表示される
      expect(screen.getAllByText("100 pts")).toHaveLength(3)

      // 「実績入力」セクションを展開
      fireEvent.click(screen.getByText("実績入力"))

      // スプリントを追加して20pt入力
      fireEvent.click(screen.getByText("スプリントを追加"))
      const actualInput = screen.getByLabelText("Sprint 1 実績ポイント")
      fireEvent.change(actualInput, { target: { value: "20" } })

      // 残ポイント 80 pts (100 - 20) で再計算され表示される
      expect(screen.getAllByText("80 pts")).toHaveLength(3)
      // 元の 100 pts バッジは結果カードから消える
      expect(screen.queryByText("100 pts")).not.toBeInTheDocument()
    })

    it("実績入力がなければ元の計算結果がそのまま表示される", () => {
      render(<Home />)
      fireEvent.click(screen.getByText("予測を計算"))
      expect(screen.getAllByText("100 pts")).toHaveLength(3)
    })

    it("実績入力後もバーンダウンチャートが表示される", () => {
      render(<Home />)
      fireEvent.click(screen.getByText("予測を計算"))
      fireEvent.click(screen.getByText("実績入力"))
      fireEvent.click(screen.getByText("スプリントを追加"))
      const actualInput = screen.getByLabelText("Sprint 1 実績ポイント")
      fireEvent.change(actualInput, { target: { value: "15" } })
      expect(screen.getByTestId("burndown-chart")).toBeInTheDocument()
    })
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
