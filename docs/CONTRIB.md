# コントリビューションガイド

**最終更新:** 2026-03-08

## 開発環境セットアップ

### 必要条件

- Node.js 20+ (推奨: 23.x)
- npm
- Git

### セットアップ手順

```bash
git clone <repository-url>
cd runway
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

### 環境変数

このプロジェクトは環境変数不要。外部 API への依存はなく、すべてブラウザ上で完結する。

---

## スクリプト一覧

| コマンド | package.json キー | 説明 |
|---|---|---|
| `npm run dev` | `dev` | 開発サーバー起動（Next.js dev、ホットリロード有効） |
| `npm run build` | `build` | プロダクションビルド（`.next/` に出力） |
| `npm start` | `start` | プロダクションビルドを起動（要 `build` 実行済み） |
| `npm run lint` | `lint` | ESLint による静的解析 |
| `npm test` | `test` | Jest によるユニット + コンポーネントテスト実行 |

### テスト関連の追加コマンド

```bash
# ウォッチモード
npm test -- --watch

# カバレッジレポート
npm test -- --coverage

# 特定テストファイルのみ実行
npm test -- --testPathPattern=forecast

# unit プロジェクトのみ実行
npm test -- --selectProjects=unit

# components プロジェクトのみ実行
npm test -- --selectProjects=components

# キャッシュクリアして再実行
npm test -- --clearCache && npm test
```

---

## 開発ワークフロー

### 1. main を最新化する

```bash
git checkout main
git pull origin main
```

### 2. worktree を作成する

```bash
git worktree add ../runway-<作業名> -b <type>/<branch-name>
cd ../runway-<作業名>
npm install
```

ブランチ名の例:
- `fix/issue-100-mobile-date-input`
- `feat/evm-indicators`
- `refactor/burndown-chart-cleanup`

### 3. TDD で作業する

1. テストを先に書く（RED）
   - 計算ロジック: `src/lib/__tests__/` に追加
   - コンポーネント: `src/components/__tests__/` に追加
2. 実装してテストを通す（GREEN）
3. リファクタリング（IMPROVE）
4. `npm test -- --coverage` でカバレッジを確認（目標: 80%+）

### 4. コードレビュー実施後 PR を出す

```bash
git push -u origin <type>/<branch-name>
gh pr create
```

### 5. マージ後に worktree を削除する

```bash
cd ../runway
git worktree remove ../runway-<作業名>
git branch -d <type>/<branch-name>
```

---

## テスト

### テスト構成

Jest は 2 プロジェクト構成で動作する（`jest.config.js`）:

| プロジェクト | 環境 | 対象ディレクトリ | 説明 |
|---|---|---|---|
| `unit` | Node.js | `src/lib/` | 計算ロジック、ユーティリティの純粋関数テスト |
| `components` | jsdom | `src/components/`, `src/app/` | React コンポーネントの描画・操作テスト |

### テストファイル一覧

**計算ロジック（unit）:**

| テストファイル | テスト対象 |
|---|---|
| `src/lib/__tests__/forecast.test.ts` | スプリント予測計算 (`calculateForecast`) |
| `src/lib/__tests__/actual-forecast.test.ts` | 実績ベースのバーンダウン構築 (`buildActualBurndown`) |
| `src/lib/__tests__/evm.test.ts` | EVM 指標計算 (`calculateEvmMetrics`) |
| `src/lib/__tests__/velocity-stats.test.ts` | 統計ヘルパー (`average`, `stdDev`, `CV`) |
| `src/lib/__tests__/storage.test.ts` | localStorage 永続化 |
| `src/lib/__tests__/share.test.ts` | URL エンコード/デコード |
| `src/lib/__tests__/export.test.ts` | CSV エクスポート |

**コンポーネント（components）:**

| テストファイル | テスト対象 |
|---|---|
| `src/app/__tests__/page.test.tsx` | メインページ統合テスト |
| `src/components/__tests__/burndown-chart.test.ts` | バーンダウンチャート |
| `src/components/__tests__/completed-sprints.test.tsx` | 実績スプリント入力 |
| `src/components/__tests__/evm-indicators.test.tsx` | EVM 指標表示 |
| `src/components/__tests__/forecast-form.test.tsx` | 基本入力フォーム |
| `src/components/__tests__/forecast-result.test.tsx` | 予測結果カード |
| `src/components/__tests__/sprint-table.test.tsx` | スプリントテーブル |
| `src/components/__tests__/velocity-history.test.tsx` | 過去ベロシティ入力 |
| `src/components/__tests__/velocity-phases.test.tsx` | ベロシティフェーズ設定 |

### テストの方針

- 計算ロジック（`src/lib/*.ts`）は必ずユニットテストを書く
- 純粋関数として実装するため、テストは入出力の検証に集中できる
- UI コンポーネントは Testing Library (`@testing-library/react`) で描画・操作テストを書く
- `src/test-setup.ts` で `@testing-library/jest-dom` のマッチャーをセットアップ済み

### 現在のカバレッジ状況

| 領域 | カバレッジ |
|---|---|
| lib（計算ロジック） | 95.33% |
| components | 73.56% |
| hooks | 60.00% |
| 全体 | 77.97% |

テストスイート: 16 件 / テスト: 137 件（全件パス）

---

## アーキテクチャ概要

```
src/
  app/
    layout.tsx             # ルートレイアウト
    page.tsx               # メインページ（クライアントコンポーネント、全状態管理）
    globals.css            # Tailwind + shadcn CSS 変数
    __tests__/page.test.tsx
  components/
    ui/                    # shadcn/ui コンポーネント（自動生成、原則編集しない）
    forecast-form.tsx      # 基本入力（ポイント・開始日・スプリント日数・バッファ・DL）
    velocity-phases.tsx    # ベロシティフェーズ設定（日付ベース、動的追加/削除）
    velocity-history.tsx   # 過去スプリント実績入力 → 平均値計算 → フェーズ1に適用
    completed-sprints.tsx  # 実績スプリント入力（バーンダウン実績線に使用）
    forecast-result.tsx    # 3シナリオ完了日カード（デッドラインバッジ付き）
    burndown-chart.tsx     # バーンダウンチャート (recharts) — dynamic() で SSR 無効化
    sprint-table.tsx       # スプリント別詳細テーブル（CSV エクスポート対応）
    evm-indicators.tsx     # EVM 指標カード（SPI, SV, TCPI など）
    theme-toggle.tsx       # ダーク/ライトモード切り替え
    __tests__/             # コンポーネントテスト
  lib/
    types.ts               # コア型定義 (ForecastInput, ForecastResult, Scenario, EvmMetrics)
    forecast.ts            # 予測計算ロジック（純粋関数）
    evm.ts                 # EVM 指標計算 (calculateEvmMetrics)
    storage.ts             # localStorage 永続化 (saveState / loadState)
    share.ts               # URL シェア: encodeState / decodeState (URL-safe base64)
    export.ts              # CSV エクスポート: toCsv / downloadCsv
    velocity-stats.ts      # 統計ヘルパー (average, stdDev, CV)
    utils.ts               # cn() ヘルパー (shadcn), roundPt()
    __tests__/             # lib モジュールのユニットテスト
  hooks/
    use-theme.ts           # ダークモード状態フック
```

### 設計方針

- 計算ロジックは `src/lib/` の純粋関数に集約する
- 状態管理は `src/app/page.tsx` に集約し、コンポーネントは props 経由でデータを受け取る
- `src/components/ui/` は shadcn が管理するため、直接編集しない
- イミュータブルなデータ操作（`readonly` 型を徹底）

---

## コーディングスタイル

- TypeScript strict モード
- Tailwind CSS v4 でスタイリング（インラインクラス）
- イミュータブルなデータ操作（オブジェクトを直接変更しない、`readonly` を活用）
- 関数は 50 行以内、ファイルは 800 行以内を目安に
- `src/lib/` 内の関数は純粋関数として実装する

## コミットメッセージ形式

```
<type>: <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

例:
```
fix: バーンダウンチャートの高さをモバイルでレスポンシブ対応
feat: EVM指標（SPI, SV, TCPI）の表示を追加
docs: CONTRIB.mdにテスト構成の詳細を追加
```
