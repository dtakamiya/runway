# Runway

スプリント完了予測ツール。チームのベロシティとバックログの残ストーリーポイントから、開発完了時期を予測する。

## 機能

- **3シナリオ予測** - 楽観・標準・悲観の完了日を同時に表示
- **ベロシティフェーズ設定** - 日付ベースでベロシティを変化させる（人員増減対応）
- **過去ベロシティ入力** - 過去スプリントの実績を入力して平均値を自動計算・適用
- **実績スプリント入力** - 消化済みスプリントの実績ポイントを入力してバーンダウンに反映
- **バーンダウンチャート** - 楽観・標準・悲観の3ラインをrecharts で描画
- **スプリント別詳細テーブル** - 各スプリントの期間・消化ポイント・残ポイントを一覧表示
- **URLシェア機能** - 入力状態をURLにエンコードして共有
- **入力状態の永続化** - LocalStorage に保存してページ再読み込み後も維持
- **ダークモード対応**

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- shadcn/ui + Tailwind CSS v4
- recharts
- date-fns
- Jest + ts-jest + Testing Library

## セットアップ

```bash
git clone <repository-url>
cd runway
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## 開発コマンド

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm test` | Jest テスト実行 |
| `npm run lint` | ESLint 実行 |

## アーキテクチャ

```
src/
  app/
    layout.tsx          # ルートレイアウト
    page.tsx            # メインページ（クライアントコンポーネント、状態管理）
    globals.css         # Tailwind + shadcn CSS 変数
  components/
    ui/                 # shadcn/ui コンポーネント
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

## ドメイン用語

| 用語 | 説明 |
|---|---|
| Story Point | タスクの相対的な見積もり単位 |
| Velocity | チームが1スプリントで消化できるストーリーポイントの平均値 |
| Sprint | 固定期間の開発イテレーション（通常1〜4週間） |
| Runway | 残バックログをベロシティで割った、完了までの予測スプリント数 |
| Burndown | 残ポイントの時系列推移 |
| VelocityPhase | 日付ベースのベロシティ変化（人員増減等） |
| Scenario | 楽観/標準/悲観の3パターン予測 |
