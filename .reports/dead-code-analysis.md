# Dead Code Analysis Report

Generated: 2026-03-07

## Summary

- Tools used: `depcheck`, `ts-unused-exports`
- Baseline: 101 tests, 13 suites - all passing

---

## Findings

### SAFE - Actionable Items

| # | Item | File | Action |
|---|------|------|--------|
| 1 | `export type ActualBurndownPoint` | `src/lib/forecast.ts:11` | `export` を削除 (内部専用型) |
| 2 | `@testing-library/user-event` | `package.json` | devDependencies から削除 (テストで未使用) |

### CAUTION - Intentionally Exported (shadcn/ui)

shadcn/ui の自動生成コンポーネントは、ライブラリ的に外部公開されているため変更しない。

- `buttonVariants` (`button.tsx`)
- `badgeVariants` (`badge.tsx`)
- `CardFooter`, `CardAction`, `CardDescription` (`card.tsx`)
- `TableFooter`, `TableCaption` (`table.tsx`)
- `SelectGroup`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator` (`select.tsx`)
- `AlertDialogMedia`, `AlertDialogOverlay`, `AlertDialogPortal` (`alert-dialog.tsx`)

### KEEP - False Positives from depcheck

depcheck が誤検知したが実際は必要なパッケージ:

| Package | Reason |
|---------|--------|
| `@tailwindcss/postcss` | `postcss.config.mjs` で使用 |
| `@types/jest` | TypeScript + Jest に必要 |
| `jest-environment-jsdom` | `jest.config.js` の `testEnvironment: "jsdom"` |
| `shadcn` | CLIツール (コードからは参照されない) |
| `tailwindcss` | CSS処理に必要 |
| `tw-animate-css` | `src/app/globals.css` で `@import` |

### KEEP - Type Exports Serving Documentation

- `export type VelocityStats` (`velocity-stats.ts:1`) - 関数の戻り値型として API ドキュメント目的で維持

---

## Actions Taken

1. `ActualBurndownPoint` の `export` を削除
2. `@testing-library/user-event` を devDependencies から削除
