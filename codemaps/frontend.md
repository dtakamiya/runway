# Frontend Codemap

**Last Updated:** 2026-03-08
**Framework:** Next.js 16.1.6 (App Router), React 19.2.3
**Styling:** Tailwind CSS v4, shadcn/ui (Radix UI)
**Chart:** recharts 3.7.0

## Component Tree

```
RootLayout (layout.tsx)
  |-- Dark mode init script (inline <script>)
  |-- Skip-to-content link (a11y)
  |
  +-- Home (page.tsx) -- "use client", owns all state
        |
        +-- Header: brand logo (Plane icon) + title + subtitle
        |     +-- "URLをコピー" Button (share)
        |     +-- ThemeToggle (dark/light)
        |
        +-- Restore Banner (conditional, blue info bar)
        |     +-- Reset Button -> AlertDialog confirmation
        |
        +-- ForecastForm (Card: 基本設定)
        |     +-- totalPoints (Input number)
        |     +-- startDate (Input date)
        |     +-- sprintDays (Select: 7/14/21/28)
        |     +-- bufferPercent (Input number)
        |     +-- deadline (Input date + clear button)
        |
        +-- VelocityPhases (Card: ベロシティフェーズ)
        |     +-- Phase rows (dynamic add/remove)
        |     |     +-- fromDate (Input date, snap-to-sprint on blur)
        |     |     +-- velocity (Input number)
        |     |     +-- label (Input text)
        |     |     +-- delete button
        |     +-- "フェーズを追加" Button
        |
        +-- VelocityHistory (Card: 過去のベロシティから計算, collapsible)
        |     +-- Raw velocity input (comma-separated)
        |     +-- Stats grid (count, avg, min/max, stdDev, CV%)
        |     +-- CV% warning (>= 30%)
        |     +-- "この値を使う" Button -> apply to phase 1
        |
        +-- CompletedSprints (Card: 実績入力, collapsible)
        |     +-- Sprint rows (dynamic add/remove)
        |     |     +-- Sprint number + date range
        |     |     +-- actualPoints (Input number)
        |     |     +-- delete button
        |     +-- "スプリントを追加" Button
        |     +-- Total consumed / progress %
        |
        +-- "値が変更されました" warning (conditional)
        +-- "予測を計算" Button (full-width, pulse on dirty)
        +-- Empty state placeholder (conditional)
        |
        +-- Results section (conditional, animated fade-in)
              +-- ForecastResultCards (3 cards: 好調/標準/不調)
              |     +-- Scenario date, sprint count, total pts
              |     +-- DeadlineBadge ("間に合う" / "X日超過")
              |
              +-- EvmIndicators (Card: EVM健全性, conditional)
              |     +-- SPI, SV, EAC(t), TCPI
              |     +-- Summary text
              |
              +-- BurndownChart (Card: バーンダウンチャート)
              |     +-- ComposedChart (recharts)
              |     |     +-- Area: 好調/標準/不調 scenarios
              |     |     +-- Line: 実績 (actual, conditional)
              |     |     +-- ReferenceLine: 今日, DL, phase changes
              |     |     +-- ReferenceDot: today ideal remaining
              |     +-- Delay/ahead badge
              |     +-- Ideal remaining display
              |
              +-- SprintTable (Card: スプリント詳細)
                    +-- Tabs: 好調/標準/不調
                    +-- ScenarioTable per tab
                    +-- CSV export button per scenario
```

## Component Details

| Component | File | Lines | Exports | Props |
|-----------|------|-------|---------|-------|
| Home | page.tsx | 466 | default | - |
| ForecastForm | forecast-form.tsx | 140 | ForecastForm, FormData, FormErrors | data, onChange, errors? |
| VelocityPhases | velocity-phases.tsx | 174 | VelocityPhases, PhaseFormData | phases, onChange, sprintDays?, startDate?, velocityError? |
| VelocityHistory | velocity-history.tsx | 86 | VelocityHistory | onApply |
| CompletedSprints | completed-sprints.tsx | 143 | CompletedSprints, CompletedSprintFormData | sprints, onChange, startDate?, sprintDays?, totalPoints? |
| ForecastResultCards | forecast-result.tsx | 124 | ForecastResultCards | result, deadline? |
| EvmIndicators | evm-indicators.tsx | 86 | EvmIndicators | metrics |
| BurndownChart | burndown-chart.tsx | 458 | BurndownChart, buildBaseDataPoints, collectSpecialPoints, buildChartData, findPhaseChangeMarkers | result, velocityPhases, deadline?, completedSprints?, totalPoints?, bufferPercent? |
| SprintTable | sprint-table.tsx | 140 | SprintTable | result |
| ThemeToggle | theme-toggle.tsx | 25 | ThemeToggle | - |

## Import Graph (non-ui)

```
page.tsx
  +-- forecast-form.tsx
  +-- velocity-phases.tsx
  |     +-- lib/forecast.ts (snapToSprintStart)
  +-- velocity-history.tsx
  |     +-- lib/velocity-stats.ts
  +-- completed-sprints.tsx
  +-- forecast-result.tsx
  |     +-- lib/types.ts
  +-- evm-indicators.tsx
  |     +-- lib/types.ts
  +-- burndown-chart.tsx (dynamic import, ssr:false)
  |     +-- lib/types.ts
  |     +-- lib/utils.ts (roundPt)
  |     +-- lib/forecast.ts (getIdealRemainingAtDate, buildActualBurndown, calculateDelayDays)
  |     +-- hooks/use-theme.ts
  +-- sprint-table.tsx
  |     +-- lib/export.ts (toCsv, downloadCsv)
  |     +-- lib/utils.ts (roundPt)
  |     +-- lib/types.ts
  +-- theme-toggle.tsx
  |     +-- hooks/use-theme.ts
  +-- lib/forecast.ts (calculateForecast)
  +-- lib/evm.ts (calculateEvmMetrics)
  +-- lib/storage.ts (saveState, loadState)
  +-- lib/share.ts (encodeState, decodeState)
  +-- lib/types.ts
```

## shadcn/ui Primitives (src/components/ui/)

| Component | Lines | Used By |
|-----------|-------|---------|
| alert-dialog | 196 | page.tsx (reset confirmation) |
| badge | 48 | forecast-result.tsx |
| button | 64 | multiple components |
| card | 92 | multiple components |
| input | 21 | forecast-form, velocity-phases, velocity-history, completed-sprints |
| label | 24 | forecast-form, velocity-phases, velocity-history |
| select | 190 | forecast-form (sprintDays) |
| separator | 28 | page.tsx |
| table | 116 | sprint-table |
| tabs | 59 | sprint-table |

## Responsive Design

- Grid: `grid-cols-1 sm:grid-cols-2` for form fields
- Sprint table: `overflow-x-auto`, velocity column `hidden sm:table-cell`
- Date format: short on mobile (`MM/dd`), full on desktop (`yyyy/MM/dd`)
- Burndown chart height: `h-[250px] sm:h-[350px]`
- Result cards: `grid-cols-1 md:grid-cols-3`, standard card emphasized with `md:scale-[1.03]`
- Header subtitle: `hidden sm:block`
- VelocityPhases delete: icon on `md:flex`, text button on `md:hidden`

## Accessibility

- Skip-to-content link (layout.tsx)
- `aria-expanded` / `aria-controls` on collapsible sections
- `aria-label` on icon-only buttons
- `motion-reduce:animate-none` on animations
- `lang="ja"` on `<html>`
- `suppressHydrationWarning` for dark mode hydration
