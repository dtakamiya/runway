# ランブック（運用手順書）

**最終更新:** 2026-03-08

## デプロイ手順

### 前提条件

- Node.js 20+ (推奨: 23.x)
- npm
- デプロイ先: Vercel（推奨）または任意の Next.js 対応ホスティング

### デプロイ前チェック

```bash
# 1. テストが全件パスすることを確認
npm test

# 2. ビルドがエラーなく完了することを確認
npm run build

# 3. Lint が警告・エラーなしで通ることを確認
npm run lint
```

### Vercel へのデプロイ

```bash
# Vercel CLI をインストール済みの場合
vercel

# 本番デプロイ
vercel --prod
```

または GitHub リポジトリを Vercel に連携することで、`main` ブランチへの push で自動デプロイされる。

**Vercel の設定:**
- Framework: Next.js（自動検出）
- Build Command: `npm run build`（デフォルト）
- Output Directory: `.next`（デフォルト）
- 環境変数: 不要

### セルフホスティング（Node.js サーバー）

```bash
# 1. ビルド
npm run build

# 2. 本番サーバー起動
npm start
```

デフォルトポートは 3000。`PORT` 環境変数で変更可能:

```bash
PORT=8080 npm start
```

### セルフホスティング（静的エクスポート）

このアプリは純粋なクライアントサイドアプリのため、静的エクスポートも可能。
`next.config.ts` に以下を追加した場合:

```ts
export default { output: 'export' }
```

```bash
npm run build
# out/ ディレクトリを任意の静的ファイルサーバーに配置
```

**注意:** 現在の `next.config.ts` にはこの設定は含まれていない。静的エクスポートが必要な場合は手動で追加すること。

---

## 環境変数

環境変数は不要。外部 API 依存なし。すべての計算はブラウザ側で完結する。

| 変数 | 必須 | 説明 |
|---|---|---|
| `PORT` | いいえ | `npm start` 時のリッスンポート（デフォルト: 3000） |

---

## 監視・アラート

このアプリはサーバーサイドロジックを持たないため、従来の APM は不要。

### チェック項目

| 項目 | 手段 | 頻度 |
|---|---|---|
| アプリの死活確認 | トップページへの HTTP GET が 200 を返すか | 毎分 |
| ビルド成功確認 | CI の `npm run build` が成功するか | PR ごと |
| テスト通過確認 | CI の `npm test` が通るか | PR ごと |
| Lint 通過確認 | CI の `npm run lint` が通るか | PR ごと |

### ブラウザ側で確認すべき機能

| 機能 | 確認方法 |
|---|---|
| 3シナリオ計算 | ストーリーポイントとベロシティを入力し、結果カードが3枚表示される |
| バーンダウンチャート描画 | チャートが正しく描画される（`width/height` が `-1` にならない） |
| EVM 指標表示 | 実績スプリントを2件以上入力し、SPI/SV/TCPI が表示される |
| URL シェア | 「URLをコピー」ボタンでクリップボードにコピーされ、復元できる |
| localStorage 永続化 | ページリロード後にデータが復元される |
| ダークモード | テーマ切り替えボタンで正しく切り替わる |
| モバイル表示 | 375px 幅でレイアウトが崩れない |

---

## よくある問題と対処

### `npm run dev` が起動しない

```bash
# node_modules を再インストール
rm -rf node_modules .next
npm install
npm run dev
```

### ビルドエラー: 型エラー

```bash
# TypeScript エラーの詳細を確認
npx tsc --noEmit
```

エラーメッセージに従って型定義を修正する。

### テストが失敗する

```bash
# キャッシュをクリアして再実行
npm test -- --clearCache
npm test
```

特定のテストだけ実行:

```bash
npm test -- --testPathPattern=forecast
```

特定のプロジェクト（unit / components）だけ実行:

```bash
npm test -- --selectProjects=unit
npm test -- --selectProjects=components
```

### バーンダウンチャートが描画されない

recharts は `ResponsiveContainer` の width/height が確定するまでレンダリングをスキップする。
SSR 環境では `-1` が渡るため、クライアントサイドのみレンダリングするよう `dynamic` インポートを使用すること。

```tsx
const BurndownChart = dynamic(
  () => import("@/components/burndown-chart").then((mod) => mod.BurndownChart),
  { ssr: false }
)
```

### EVM 指標が表示されない

`calculateEvmMetrics` は以下の条件で `null` を返す:
- 実績スプリントが0件の場合
- 実績の累計消化ポイント（EV）が0の場合
- 計画上の消化ポイント（PV）が0の場合

実績スプリントを1件以上入力し、actualPoints > 0 であることを確認する。

### localStorage のデータが壊れている

ブラウザの開発者ツールで Application > Local Storage を開き、`runway-state` キーを削除する。
ページをリロードすると初期状態に戻る。

### URL シェアのデータが復元されない

URL パラメータ `?s=` に含まれる base64 文字列が破損している可能性がある。
URLを再生成するか、手動でパラメータを削除してアクセスすると localStorage のデータで復元される。

---

## ロールバック手順

### Vercel の場合

Vercel ダッシュボード > Deployments から任意のデプロイを選択して「Promote to Production」をクリック。

### セルフホスティングの場合

```bash
# 前のタグ/コミットに戻す
git checkout <previous-tag-or-commit>
npm install
npm run build
npm start
```

### 緊急時（コードリバート）

```bash
git revert HEAD
git push origin main
```

**注意:** Vercel 連携時は push により自動デプロイが走る。

---

## リリースチェックリスト

- [ ] `npm test` が全件通過（現在: 16 スイート / 137 テスト）
- [ ] `npm run build` がエラーなく完了
- [ ] `npm run lint` が警告・エラーなし
- [ ] ブラウザで 3 シナリオの計算結果が正しく表示される
- [ ] EVM 指標（SPI, SV, TCPI）が実績入力時に正しく表示される
- [ ] バーンダウンチャートが正しく描画される
- [ ] URL シェア機能が動作する（コピー & 復元）
- [ ] localStorage 永続化が動作する（リロード後に復元）
- [ ] CSV エクスポートが動作する
- [ ] ダークモードが正しく切り替わる
- [ ] モバイル表示（375px）でレイアウト崩れがない

---

## 依存パッケージ一覧

### ランタイム依存

| パッケージ | バージョン | 用途 |
|---|---|---|
| next | 16.1.6 | フレームワーク (App Router) |
| react / react-dom | 19.2.3 | UI ライブラリ |
| recharts | ^3.7.0 | バーンダウンチャート描画 |
| date-fns | ^4.1.0 | 日付計算 |
| radix-ui | ^1.4.3 | アクセシブル UI プリミティブ |
| lucide-react | ^0.577.0 | アイコン |
| class-variance-authority | ^0.7.1 | コンポーネントバリアント管理 |
| clsx | ^2.1.1 | 条件付きクラス名結合 |
| tailwind-merge | ^3.5.0 | Tailwind クラス結合 |
| geist | ^1.7.0 | Geist フォント |

### 開発依存

| パッケージ | バージョン | 用途 |
|---|---|---|
| typescript | ^5 | 型チェック |
| tailwindcss | ^4 | CSS フレームワーク |
| jest | ^29.7.0 | テストランナー |
| ts-jest | ^29.4.6 | Jest の TypeScript サポート |
| @testing-library/react | ^16.3.2 | コンポーネントテスト |
| @testing-library/jest-dom | ^6.9.1 | DOM マッチャー拡張 |
| eslint | ^9 | 静的解析 |
| eslint-config-next | 16.1.6 | Next.js 用 ESLint ルール |
| shadcn | ^3.8.5 | UI コンポーネント生成 CLI |
