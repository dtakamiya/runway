# コントリビューションガイド

## 開発環境セットアップ

### 必要条件

- Node.js 20+
- npm

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

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動（Next.js dev、ホットリロード有効） |
| `npm run build` | プロダクションビルド（`.next/` に出力） |
| `npm start` | プロダクションビルドを起動（要 `build` 実行済み） |
| `npm run lint` | ESLint による静的解析 |
| `npm test` | Jest によるユニットテスト実行 |

---

## 開発ワークフロー

1. **main を最新化する**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **worktree を作成する**

   ```bash
   git worktree add ../runway-fix-<issue番号> -b fix/issue-<issue番号>
   cd ../runway-fix-<issue番号>
   npm install
   ```

3. **TDD で作業する**

   - `src/lib/__tests__/` にテストを先に書く（RED）
   - 実装してテストを通す（GREEN）
   - リファクタリング（IMPROVE）
   - `npm test` でカバレッジを確認

4. **コードレビュー実施後 PR を出す**

   ```bash
   git push -u origin fix/issue-<issue番号>
   gh pr create
   ```

5. **マージ後に worktree を削除する**

   ```bash
   cd ../runway
   git worktree remove ../runway-fix-<issue番号>
   git branch -d fix/issue-<issue番号>
   ```

---

## テスト

### テストファイルの場所

```
src/lib/__tests__/forecast.test.ts   # 予測計算ロジックのユニットテスト
```

### テスト実行

```bash
# 全テスト実行
npm test

# ウォッチモード
npm test -- --watch

# カバレッジレポート
npm test -- --coverage
```

### テストの方針

- 計算ロジック（`src/lib/forecast.ts`）は必ずユニットテストを書く
- 純粋関数として実装するため、テストは簡潔に書ける
- UI コンポーネントのテストは Testing Library で対応可能

---

## アーキテクチャ概要

```
src/
  app/
    layout.tsx          # ルートレイアウト
    page.tsx            # メインページ（クライアントコンポーネント、状態管理）
    globals.css         # Tailwind + shadcn CSS 変数
  components/
    ui/                 # shadcn/ui コンポーネント（自動生成、原則編集しない）
    forecast-form.tsx   # 基本入力（ポイント・開始日・スプリント日数・バッファ）
    velocity-phases.tsx # ベロシティフェーズ設定（日付ベース、動的追加/削除）
    forecast-result.tsx # 3シナリオ完了日カード
    burndown-chart.tsx  # バーンダウンチャート（recharts）
    sprint-table.tsx    # スプリント別詳細テーブル
  lib/
    utils.ts            # cn() ヘルパー（shadcn）
    forecast.ts         # 予測計算ロジック（純粋関数）
    types.ts            # 型定義
    __tests__/
      forecast.test.ts  # forecast ロジックのユニットテスト
```

### 設計方針

- 計算ロジックは `src/lib/forecast.ts` の純粋関数に集約する
- 状態管理は `src/app/page.tsx` に集約し、コンポーネントは props 経由でデータを受け取る
- `src/components/ui/` は shadcn が管理するため、直接編集しない

---

## コーディングスタイル

- TypeScript strict モード
- Tailwind CSS v4 でスタイリング（インラインクラス）
- イミュータブルなデータ操作（オブジェクトを直接変更しない）
- 関数は 50 行以内、ファイルは 800 行以内を目安に

## コミットメッセージ形式

```
<type>: <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

例:
```
fix: バーンダウンチャートの高さをモバイルでレスポンシブ対応
feat: スプリント完了日のDeadline超過バッジを追加
```
