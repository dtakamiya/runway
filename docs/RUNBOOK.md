# ランブック（運用手順書）

## デプロイ手順

### 前提条件

- Node.js 20+
- npm
- デプロイ先: Vercel（推奨）または任意の Next.js 対応ホスティング

### Vercel へのデプロイ

```bash
# Vercel CLI をインストール済みの場合
vercel

# 本番デプロイ
vercel --prod
```

または GitHub リポジトリを Vercel に連携することで、`main` ブランチへの push で自動デプロイされる。

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
# out/ ディレクトリをサーバーに配置
```

---

## 環境変数

環境変数は不要。外部 API 依存なし。

---

## 監視・アラート

このアプリはサーバーサイドロジックを持たないため、従来の APM は不要。

### チェック項目

| 項目 | 手段 |
|---|---|
| アプリの死活確認 | トップページへの HTTP GET が 200 を返すか |
| ビルド成功確認 | CI の `npm run build` が成功するか |
| テスト通過確認 | CI の `npm test` が通るか |

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

### バーンダウンチャートが描画されない

recharts は `ResponsiveContainer` の width/height が確定するまでレンダリングをスキップする。
SSR 環境では `-1` が渡るため、クライアントサイドのみレンダリングするよう `dynamic` インポートを使用すること。

```tsx
const BurndownChart = dynamic(() => import('@/components/burndown-chart'), { ssr: false })
```

### LocalStorage のデータが壊れている

ブラウザの開発者ツールで Application > Local Storage を開き、`runway-state` キーを削除する。

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

---

## リリースチェックリスト

- [ ] `npm test` が全件通過
- [ ] `npm run build` がエラーなく完了
- [ ] `npm run lint` が警告・エラーなし
- [ ] ブラウザで 3 シナリオの計算結果が正しく表示される
- [ ] URLシェア機能が動作する
- [ ] ダークモードが正しく切り替わる
- [ ] モバイル表示（375px）でレイアウト崩れがない
