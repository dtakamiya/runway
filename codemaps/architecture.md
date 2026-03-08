# Architecture Codemap

**Last Updated:** 2026-03-08
**Framework:** Next.js 16.1.6 (App Router) + TypeScript
**Runtime:** Client-side only (no backend)
**Entry Point:** `src/app/layout.tsx` -> `src/app/page.tsx`

## High-Level Architecture

```
+--------------------------------------------------+
|                    Browser                        |
+--------------------------------------------------+
|  layout.tsx (RootLayout)                          |
|    +-- page.tsx (Home) -- "use client"            |
|    |     Owns ALL state (FormData, phases, result)|
|    |                                              |
|    |   +-- ForecastForm (基本設定)                 |
|    |   +-- VelocityPhases (ベロシティフェーズ)       |
|    |   +-- VelocityHistory (過去ベロシティ)         |
|    |   +-- CompletedSprints (実績入力)              |
|    |   +-- ForecastResultCards (3シナリオ結果)       |
|    |   +-- EvmIndicators (EVM健全性)               |
|    |   +-- BurndownChart (バーンダウン/recharts)    |
|    |   +-- SprintTable (詳細テーブル/CSV)           |
|    |   +-- ThemeToggle (ダーク/ライト)              |
|    |                                              |
+----+----------------------------------------------+
     |
     v
+---------------------------+   +------------------+
| lib/ (Pure Functions)     |   | Persistence      |
| - forecast.ts (計算)      |   | - localStorage   |
| - evm.ts (EVM指標)        |   | - URL params (?s)|
| - velocity-stats.ts (統計)|   +------------------+
| - export.ts (CSV)         |
| - share.ts (URL共有)      |
| - storage.ts (保存/復元)  |
| - utils.ts (cn, roundPt)  |
| - types.ts (型定義)       |
+---------------------------+
```

## Directory Structure

```
src/                          3,060 lines total (excl. tests, ui primitives)
  app/
    layout.tsx          (39)   Root layout, Geist font, dark mode init script
    page.tsx           (466)   Main page: state management, orchestration
    globals.css                Tailwind CSS v4 + shadcn CSS variables
    __tests__/                 page.test.tsx
  components/
    forecast-form.tsx  (140)   Basic settings input (points, date, sprint, buffer, DL)
    velocity-phases.tsx(174)   Date-based velocity phase management
    velocity-history.tsx(86)   Past velocity input -> average calculation
    completed-sprints.tsx(143) Actual sprint results input
    forecast-result.tsx(124)   3-scenario completion date cards
    evm-indicators.tsx  (86)   EVM health indicators (SPI, SV, EAC, TCPI)
    burndown-chart.tsx (458)   Recharts ComposedChart (SSR disabled)
    sprint-table.tsx   (140)   Tabbed sprint breakdown + CSV export
    theme-toggle.tsx    (25)   Dark/light mode toggle button
    ui/                (838)   shadcn/ui primitives (10 components)
    __tests__/                 Component tests (7 files)
  lib/
    types.ts            (53)   Domain types (7 types)
    forecast.ts        (189)   Pure calculation: sprint simulation, burndown
    evm.ts              (59)   EVM metrics calculation
    velocity-stats.ts   (29)   Statistical helpers (avg, stdDev, CV)
    storage.ts          (51)   localStorage save/load
    share.ts            (35)   URL-safe base64 encode/decode
    export.ts           (30)   CSV generation + download
    utils.ts            (11)   cn() for Tailwind, roundPt()
    __tests__/                 Unit tests (7 files)
  hooks/
    use-theme.ts        (34)   Dark mode state + system preference
```

## State Flow

```
User Input
    |
    v
page.tsx (useState)
    |
    +-- formData: FormData (strings)
    +-- phases: PhaseFormData[] (strings)
    +-- completedSprintForms: CompletedSprintFormData[] (strings)
    |
    v  (useMemo: string -> domain type conversion)
    |
    +-- velocityPhases: VelocityPhase[] (numbers, Date)
    +-- completedSprints: CompletedSprint[] (numbers)
    |
    v  ("予測を計算" button -> performCalculate())
    |
    calculateForecast(ForecastInput) -> ForecastResult
    |
    +-- result: ForecastResult | null
    |
    v  (useMemo: 実績考慮の再計算)
    |
    +-- displayResult: ForecastResult | null
    +-- evmMetrics: EvmMetrics | null
    |
    v
    Child components render results
```

## Persistence Flow

```
State Change -> saveState() -> localStorage ("runway-state")
                                    |
Mount ->  URL ?s= param (priority)  |
          localStorage (fallback) <-+
          |
          v
        Restore banner ("前回の入力内容を復元しました" / "共有URLから設定を復元しました")
        Reset dialog (AlertDialog confirmation)
```

## Dependencies (package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | Framework (App Router) |
| react / react-dom | 19.2.3 | UI library |
| recharts | ^3.7.0 | Burndown chart (ComposedChart, Area, Line) |
| date-fns | ^4.1.0 | Date arithmetic (addDays, format, parseISO, differenceInDays) |
| radix-ui | ^1.4.3 | Headless UI primitives (via shadcn) |
| lucide-react | ^0.577.0 | Icons |
| class-variance-authority | ^0.7.1 | Component variant system |
| clsx + tailwind-merge | latest | Conditional class merging |
| geist | ^1.7.0 | Font (GeistSans, GeistMono) |
| tailwindcss | ^4 | Utility CSS |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| jest + ts-jest + jest-environment-jsdom | Testing |
| @testing-library/react + @testing-library/jest-dom | Component testing |
| eslint + eslint-config-next | Linting |
| typescript ^5 | Type checking |
| shadcn ^3.8.5 | UI component generator CLI |

## Key Design Decisions

1. **No backend** -- All logic runs client-side. No API routes, no database.
2. **Single-page app** -- One route (`/`), one page component owns all state.
3. **String-based forms** -- Form inputs are strings; converted to domain types via `useMemo`.
4. **SSR disabled for chart** -- `BurndownChart` loaded via `dynamic(..., { ssr: false })` due to recharts DOM dependency.
5. **Immutable patterns** -- All types use `readonly`; state updates create new objects.
6. **Pure calculation** -- `forecast.ts` and `evm.ts` are side-effect-free pure functions.
