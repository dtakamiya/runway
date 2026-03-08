import { test, expect } from "@playwright/test"

const SCREENSHOT_DIR = "tests/e2e/screenshots"

test.describe("Runway - Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // localStorage をクリアして初期状態でテスト開始
    await page.goto("/")
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState("networkidle")
  })

  test("1. Page load - form is displayed", async ({ page }) => {
    // ヘッダー: Runway タイトルが表示される
    await expect(page.locator("h1")).toContainText("Runway")

    // 基本設定カードが表示される
    await expect(page.getByText("基本設定")).toBeVisible()

    // フォームフィールドが表示される
    await expect(page.locator("#totalPoints")).toBeVisible()
    await expect(page.locator("#startDate")).toBeVisible()
    await expect(page.locator("#sprintDays")).toBeVisible()
    await expect(page.locator("#buffer")).toBeVisible()
    await expect(page.locator("#deadline")).toBeVisible()

    // ベロシティフェーズセクションが表示される
    await expect(page.getByText("ベロシティフェーズ")).toBeVisible()

    // 「予測を計算」ボタンが表示される
    await expect(page.getByRole("button", { name: "予測を計算" })).toBeVisible()

    // 未計算状態のプレースホルダーが表示される
    await expect(page.getByText("完了予測を確認しましょう")).toBeVisible()

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-page-load.png`,
      fullPage: true,
    })
  })

  test("2. Fill form and calculate forecast", async ({ page }) => {
    // --- 基本設定入力 ---
    // ストーリーポイント合計
    const totalPointsInput = page.locator("#totalPoints")
    await totalPointsInput.fill("")
    await totalPointsInput.fill("120")

    // 開始日
    const startDateInput = page.locator("#startDate")
    await startDateInput.fill("2026-04-01")

    // スプリント期間（Select コンポーネント）
    await page.locator("#sprintDays").click()
    await page.getByRole("option", { name: "2週間" }).click()

    // バッファ
    const bufferInput = page.locator("#buffer")
    await bufferInput.fill("")
    await bufferInput.fill("15")

    // デッドライン
    const deadlineInput = page.locator("#deadline")
    await deadlineInput.fill("2026-09-30")

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-form-filled-basic.png`,
      fullPage: true,
    })

    // --- ベロシティフェーズ入力 ---
    // デフォルトで1つのフェーズが存在する。ベロシティを設定
    const phaseVelocityInputs = page.locator(
      'input[type="number"][placeholder="15"]'
    )
    await phaseVelocityInputs.first().fill("")
    await phaseVelocityInputs.first().fill("18")

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-velocity-phase-filled.png`,
      fullPage: true,
    })

    // --- 予測を計算 ---
    await page.getByRole("button", { name: "予測を計算" }).click()

    // 結果が表示されるまで待つ
    await page.waitForSelector('[data-scenario="standard"]', { timeout: 10000 })

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-forecast-calculated.png`,
      fullPage: true,
    })
  })

  test("3. Forecast result - 3 scenario cards displayed", async ({ page }) => {
    // フォームに値を入力して計算
    await fillFormAndCalculate(page)

    // 3つのシナリオカードが表示される
    const highVelocityCard = page.locator('[data-scenario="highVelocity"]')
    const standardCard = page.locator('[data-scenario="standard"]')
    const lowVelocityCard = page.locator('[data-scenario="lowVelocity"]')

    await expect(highVelocityCard).toBeVisible()
    await expect(standardCard).toBeVisible()
    await expect(lowVelocityCard).toBeVisible()

    // 各カードにシナリオ名が表示される
    await expect(highVelocityCard).toContainText("好調")
    await expect(standardCard).toContainText("標準")
    await expect(lowVelocityCard).toContainText("不調")

    // 標準シナリオに「推奨」バッジがある
    await expect(standardCard).toContainText("推奨")

    // 各カードに日付が表示される (yyyy/MM/dd 形式)
    const datePattern = /\d{4}\/\d{2}\/\d{2}/
    await expect(highVelocityCard.locator("text=/\\d{4}\\/\\d{2}\\/\\d{2}/")).toBeVisible()
    await expect(standardCard.locator("text=/\\d{4}\\/\\d{2}\\/\\d{2}/")).toBeVisible()
    await expect(lowVelocityCard.locator("text=/\\d{4}\\/\\d{2}\\/\\d{2}/")).toBeVisible()

    // 各カードに「スプリント」と「pts」が表示される
    await expect(highVelocityCard).toContainText("スプリント")
    await expect(standardCard).toContainText("スプリント")
    await expect(lowVelocityCard).toContainText("スプリント")
    await expect(highVelocityCard).toContainText("pts")
    await expect(standardCard).toContainText("pts")
    await expect(lowVelocityCard).toContainText("pts")

    // デッドラインを設定しているので、「間に合う」か「日超過」のバッジがある
    const deadlineBadges = page.locator("text=/間に合う|日超過/")
    expect(await deadlineBadges.count()).toBeGreaterThanOrEqual(1)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-scenario-cards.png`,
      fullPage: true,
    })
  })

  test("4. Burndown chart is displayed", async ({ page }) => {
    await fillFormAndCalculate(page)

    // バーンダウンチャートのカードが表示される
    await expect(page.getByText("バーンダウンチャート")).toBeVisible()

    // recharts の SVG が描画される
    const chartSvg = page.locator(".recharts-wrapper")
    await expect(chartSvg).toBeVisible()

    // チャート内に線が描画されている
    const chartLines = page.locator(".recharts-area")
    expect(await chartLines.count()).toBeGreaterThanOrEqual(1)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-burndown-chart.png`,
      fullPage: true,
    })
  })

  test("5. Sprint table is displayed", async ({ page }) => {
    await fillFormAndCalculate(page)

    // スプリント詳細カードが表示される
    await expect(page.getByText("スプリント詳細")).toBeVisible()

    // タブが表示される（好調・標準・不調）
    await expect(page.getByRole("tab", { name: /好調/ })).toBeVisible()
    await expect(page.getByRole("tab", { name: /標準/ })).toBeVisible()
    await expect(page.getByRole("tab", { name: /不調/ })).toBeVisible()

    // 標準タブがデフォルトでアクティブ
    const standardTab = page.getByRole("tab", { name: /標準/ })
    await expect(standardTab).toHaveAttribute("data-state", "active")

    // テーブルヘッダーが表示される
    await expect(page.getByRole("columnheader", { name: "スプリント" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "期間" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /残り/ })).toBeVisible()

    // テーブル行が存在する（少なくとも1行）
    const tableRows = page.locator("tbody tr")
    expect(await tableRows.count()).toBeGreaterThanOrEqual(1)

    // 最初の行に "S1" が表示される
    await expect(tableRows.first()).toContainText("S1")

    // CSVエクスポートボタンが表示される
    await expect(
      page.getByRole("button", { name: /CSVエクスポート/ })
    ).toBeVisible()

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-sprint-table.png`,
      fullPage: true,
    })
  })

  test("6. Switch sprint table tabs", async ({ page }) => {
    await fillFormAndCalculate(page)

    // 好調タブをクリック
    await page.getByRole("tab", { name: /好調/ }).click()
    await expect(page.getByRole("tab", { name: /好調/ })).toHaveAttribute(
      "data-state",
      "active"
    )
    // テーブルが表示されている
    expect(await page.locator("tbody tr").count()).toBeGreaterThanOrEqual(1)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/08-sprint-table-high-velocity.png`,
      fullPage: true,
    })

    // 不調タブをクリック
    await page.getByRole("tab", { name: /不調/ }).click()
    await expect(page.getByRole("tab", { name: /不調/ })).toHaveAttribute(
      "data-state",
      "active"
    )
    expect(await page.locator("tbody tr").count()).toBeGreaterThanOrEqual(1)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-sprint-table-low-velocity.png`,
      fullPage: true,
    })
  })

  test("7. URL share button works", async ({ page, context }) => {
    await fillFormAndCalculate(page)

    // クリップボード権限を付与
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    // URLをコピーボタンをクリック
    const shareButton = page.getByRole("button", { name: /URLをコピー/ })
    await expect(shareButton).toBeVisible()
    await shareButton.click()

    // ボタンテキストが「コピーしました！」に変わる
    await expect(
      page.getByRole("button", { name: /コピーしました/ })
    ).toBeVisible()

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-url-copied.png`,
      fullPage: true,
    })

    // 2秒後に元に戻ることを確認
    await page.waitForTimeout(2500)
    await expect(
      page.getByRole("button", { name: /URLをコピー/ })
    ).toBeVisible()
  })

  test("8. CSV export button triggers download", async ({ page }) => {
    await fillFormAndCalculate(page)

    // ダウンロードイベントを待ちながらCSVエクスポートボタンをクリック
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("button", { name: /CSVエクスポート/ }).click()
    const download = await downloadPromise

    // ダウンロードされたファイル名にrunwayが含まれる
    expect(download.suggestedFilename()).toContain("runway")
    expect(download.suggestedFilename()).toContain(".csv")

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-csv-exported.png`,
      fullPage: true,
    })
  })

  test("9. Full end-to-end flow with all steps visible", async ({ page }) => {
    // Step 1: ページ読み込み確認
    await expect(page.locator("h1")).toContainText("Runway")
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-e2e-step1-load.png`,
      fullPage: true,
    })

    // Step 2: 入力
    await fillForm(page)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-e2e-step2-input.png`,
      fullPage: true,
    })

    // Step 3: 計算
    await page.getByRole("button", { name: "予測を計算" }).click()
    await page.waitForSelector('[data-scenario="standard"]', { timeout: 10000 })
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-e2e-step3-result.png`,
      fullPage: true,
    })

    // Step 4: 3つのシナリオカード確認
    await expect(page.locator('[data-scenario="highVelocity"]')).toBeVisible()
    await expect(page.locator('[data-scenario="standard"]')).toBeVisible()
    await expect(page.locator('[data-scenario="lowVelocity"]')).toBeVisible()

    // Step 5: バーンダウンチャート確認
    await expect(page.getByText("バーンダウンチャート")).toBeVisible()
    await expect(page.locator(".recharts-wrapper")).toBeVisible()

    // Step 6: スプリントテーブル確認
    await expect(page.getByText("スプリント詳細")).toBeVisible()
    expect(await page.locator("tbody tr").count()).toBeGreaterThanOrEqual(1)

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-e2e-step6-complete.png`,
      fullPage: true,
    })
  })
})

// --- Helper Functions ---

/**
 * フォームに値を入力する（計算は実行しない）
 */
async function fillForm(page: import("@playwright/test").Page) {
  // ストーリーポイント
  const totalPointsInput = page.locator("#totalPoints")
  await totalPointsInput.fill("")
  await totalPointsInput.fill("100")

  // 開始日
  await page.locator("#startDate").fill("2026-04-01")

  // スプリント期間
  await page.locator("#sprintDays").click()
  await page.getByRole("option", { name: "2週間" }).click()

  // バッファ
  const bufferInput = page.locator("#buffer")
  await bufferInput.fill("")
  await bufferInput.fill("20")

  // デッドライン
  await page.locator("#deadline").fill("2026-08-31")

  // ベロシティ（デフォルトフェーズの値を設定）
  const velocityInput = page.locator(
    'input[type="number"][placeholder="15"]'
  )
  await velocityInput.first().fill("")
  await velocityInput.first().fill("15")
}

/**
 * フォームに値を入力し、予測を計算する
 */
async function fillFormAndCalculate(page: import("@playwright/test").Page) {
  await fillForm(page)
  await page.getByRole("button", { name: "予測を計算" }).click()
  await page.waitForSelector('[data-scenario="standard"]', { timeout: 10000 })
}
