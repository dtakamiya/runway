# CLAUDE.md

## Project Overview

Runway は、ストーリーポイントとベロシティを使ってスプリントの完了予測を行うプランニングアプリケーション。チームのベロシティ（1スプリントあたりの消化ポイント数）とバックログの残ストーリーポイントから、開発完了時期を予測する。

## Workflow
- **対応を始めるときにはworktreeを作成する**
- **TDDで作業する**
- **PRを作成する**
- **worktreeを削除する**

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- shadcn/ui (Tailwind CSS v4)
- recharts (バーンダウンチャート)
- date-fns (日付計算)
- Jest + ts-jest (テスト)
- npm

## Architecture

```
src/
  app/
    layout.tsx          # Root layout
    page.tsx            # Main page (client component, state management)
    globals.css         # Tailwind + shadcn CSS variables
  components/
    ui/                 # shadcn/ui components
    forecast-form.tsx   # Basic input (points, start date, interval, buffer)
    velocity-phases.tsx # Velocity phase settings (date-based, dynamic add/remove)
    forecast-result.tsx # 3-scenario completion date cards
    burndown-chart.tsx  # Burndown chart (3 lines, recharts)
    sprint-table.tsx    # Sprint breakdown table
  lib/
    utils.ts            # cn() helper (shadcn)
    forecast.ts         # Calculation logic (pure functions)
    types.ts            # Type definitions
    __tests__/
      forecast.test.ts  # Unit tests for forecast logic
```

## Development Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint

## Domain Concepts

- **Story Point**: タスクの相対的な見積もり単位
- **Velocity**: チームが1スプリントで消化できるストーリーポイントの平均値
- **Sprint**: 固定期間の開発イテレーション（通常1-4週間）
- **Runway**: 残バックログをベロシティで割った、完了までの予測スプリント数
- **Burndown**: 残ポイントの時系列推移
- **VelocityPhase**: 日付ベースのベロシティ変化（人員増減等）
- **Scenario**: 楽観/標準/悲観の3パターン予測
