# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Runway は、ストーリーポイントとベロシティを使ってスプリントの完了予測を行うプランニングアプリケーション。チームのベロシティ（1スプリントあたりの消化ポイント数）とバックログの残ストーリーポイントから、開発完了時期を予測する。

## Workflow
- **mainを最新化する**
- **対応を始めるときにはworktreeを作成する**
- **TDDで作業する**
- **コードレビューを実施する**
- **mainにマージする**
- **worktreeを削除する**

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- shadcn/ui (Tailwind CSS v4)
- recharts (バーンダウンチャート)
- date-fns (日付計算)
- Jest + ts-jest (テスト)
- npm

## Development Commands

- `npm run dev` - Dev server (localhost:3000)
- `npm run build` - Production build
- `npm test` - Run all Jest tests
- `npm test -- --testPathPattern=forecast` - Run a single test file by pattern
- `npm run lint` - ESLint

## Architecture

```
src/
  app/
    page.tsx            # Main page: all state, orchestrates child components
    layout.tsx          # Root layout
    globals.css         # Tailwind + shadcn CSS variables
    __tests__/page.test.tsx
  components/
    ui/                 # shadcn/ui primitives (button, card, input, etc.)
    forecast-form.tsx   # Basic input (totalPoints, startDate, sprintDays, bufferPercent, deadline)
    velocity-phases.tsx # Velocity phase settings (date-based, dynamic add/remove)
    velocity-history.tsx # Past sprint velocities → average → applies to phase 1
    completed-sprints.tsx # Actual sprint results input (for burndown actuals)
    forecast-result.tsx # 3-scenario completion date cards with deadline badge
    burndown-chart.tsx  # Burndown chart (recharts) — loaded via dynamic() with ssr:false
    sprint-table.tsx    # Sprint breakdown table with CSV export
    evm-indicators.tsx  # EVM indicators card (SPI, SV, TCPI, etc.)
    theme-toggle.tsx    # Dark/light mode toggle
  lib/
    types.ts            # Core type definitions (ForecastInput, ForecastResult, Scenario, EvmMetrics)
    forecast.ts         # Pure calculation logic (calculateForecast, buildActualBurndown, etc.)
    evm.ts              # EVM metrics calculation (calculateEvmMetrics)
    storage.ts          # localStorage persistence (saveState / loadState)
    share.ts            # URL share: encodeState / decodeState (URL-safe base64)
    export.ts           # CSV export: toCsv / downloadCsv
    velocity-stats.ts   # Statistics helpers (average, stdDev, CV)
    utils.ts            # cn() helper (shadcn), roundPt()
    __tests__/          # Unit tests for all lib modules
  hooks/
    use-theme.ts        # Dark mode state hook
```

### Key Patterns

- **State flow**: `page.tsx` owns all state (`formData`, `phases`, `completedSprintForms`, `result`). Child components receive data + onChange callbacks.
- **Form data vs domain types**: Form inputs are strings (e.g. `PhaseFormData.velocity: string`). `page.tsx` converts to domain types (`VelocityPhase.velocity: number`) via `useMemo` before passing to `calculateForecast`.
- **BurndownChart SSR**: Loaded with `dynamic(..., { ssr: false })` because recharts requires browser DOM.
- **State persistence**: On every state change → `saveState()` to localStorage. On mount → URL param `?s=` checked first (shared URL), then localStorage.
- **Buffer**: `bufferPercent` scales velocity ±N% to produce optimistic/pessimistic scenarios (`highVelocity` / `lowVelocity`).

## Domain Concepts

- **Story Point**: タスクの相対的な見積もり単位
- **Velocity**: チームが1スプリントで消化できるストーリーポイントの平均値
- **Sprint**: 固定期間の開発イテレーション（通常1-4週間）
- **Runway**: 残バックログをベロシティで割った、完了までの予測スプリント数
- **Burndown**: 残ポイントの時系列推移
- **VelocityPhase**: 日付ベースのベロシティ変化（人員増減等）
- **Scenario**: 楽観/標準/悲観の3パターン予測（`highVelocity` / `standard` / `lowVelocity`）
- **CompletedSprint**: 実績入力済みスプリント（バーンダウン実績線に使用）
- **EVM (Earned Value Management)**: 実績と計画の乖離を定量的に把握する手法
- **SPI (Schedule Performance Index)**: 進捗効率（EV/PV、1.0以上で計画通り）
- **SV (Schedule Variance)**: 計画との差異ポイント数（EV - PV）
- **TCPI (To-Complete Performance Index)**: 残作業を計画通りに完了するために必要な効率
