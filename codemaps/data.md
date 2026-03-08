# Data Model Codemap

**Last Updated:** 2026-03-08
**Source:** `src/lib/types.ts` (domain types), component files (form types)

## Domain Types (src/lib/types.ts)

### VelocityPhase
```
{ fromDate: Date, velocity: number, label?: string }
```
Represents a velocity change point. Phases are sorted by `fromDate`; the active velocity for a sprint is the latest phase whose `fromDate <= sprintStartDate`.

### ForecastInput
```
{ totalPoints: number, startDate: Date, sprintDays: number (7|14|21|28),
  velocityPhases: VelocityPhase[], bufferPercent: number }
```
Input to `calculateForecast()`. All values are domain types (numbers, Dates).

### SprintBreakdown
```
{ sprintNumber: number, velocity: number, pointsBurned: number,
  remainingPoints: number, startDate: Date, endDate: Date }
```
One row of sprint simulation output. `pointsBurned = min(velocity, remaining)`.

### Scenario
```
{ totalPoints: number, sprintCount: number, endDate: Date,
  sprints: SprintBreakdown[] }
```
One scenario (optimistic/standard/pessimistic).

### ForecastResult
```
{ highVelocity: Scenario, standard: Scenario, lowVelocity: Scenario }
```
Complete forecast output. `highVelocity` = velocity * (1 + buffer), `lowVelocity` = velocity * (1 - buffer).

### CompletedSprint
```
{ sprintNumber: number, actualPoints: number }
```
A single completed sprint's actual burn, used for burndown actuals and EVM.

### EvmMetrics
```
{ bac: number, pv: number, ev: number, sv: number, svPercent: number,
  spi: number, eacSprints: number, tcpi: number | null,
  completedSprintCount: number, actualVelocityAvg: number }
```
Earned Value Management metrics computed from actuals vs. standard plan.

## Form Types (string-based, for controlled inputs)

### FormData (forecast-form.tsx)
```
{ totalPoints: string, startDate: string, sprintDays: string,
  bufferPercent: string, deadline: string }
```

### PhaseFormData (velocity-phases.tsx)
```
{ id: string, fromDate: string, velocity: string, label: string }
```

### CompletedSprintFormData (completed-sprints.tsx)
```
{ id: string, actualPoints: string }
```

### VelocityStats (velocity-stats.ts)
```
{ average: number, stdDev: number, cv: number,
  min: number, max: number, count: number }
```

## SavedState (storage.ts)

```
{
  formData: { totalPoints, startDate, sprintDays, bufferPercent, deadline } (all string),
  phases: [{ id, fromDate, velocity, label }] (all string),
  completedSprints?: [{ id, actualPoints }] (all string)
}
```
Persisted to localStorage key `"runway-state"`. Also encoded as URL-safe base64 for sharing.

## Type Conversion Flow

```
Form types (string)          Domain types (number/Date)
-----------------            -------------------------
FormData.totalPoints  ---->  ForecastInput.totalPoints  (Number())
FormData.startDate    ---->  ForecastInput.startDate    (parseISO())
FormData.sprintDays   ---->  ForecastInput.sprintDays   (Number())
FormData.bufferPercent ---->  ForecastInput.bufferPercent (Number())
PhaseFormData.fromDate ---->  VelocityPhase.fromDate     (parseISO())
PhaseFormData.velocity ---->  VelocityPhase.velocity     (Number())
CompletedSprintFormData.actualPoints --> CompletedSprint.actualPoints (Number())
```
Conversion happens in `page.tsx` via `useMemo` hooks.

## Calculation Functions

### forecast.ts

| Function | Signature | Purpose |
|----------|-----------|---------|
| `calculateForecast` | `(ForecastInput) -> ForecastResult` | Main entry: builds 3 scenarios |
| `buildActualBurndown` | `(totalPoints, CompletedSprint[], SprintBreakdown[]) -> ActualBurndownPoint[]` | Actual burndown line data |
| `calculateDelayDays` | `(totalPoints, CompletedSprint[], Scenario, sprintDays) -> number` | Delay in days vs. plan |
| `getIdealRemainingAtDate` | `(SprintBreakdown[], Date) -> number \| null` | Interpolated ideal remaining at date |
| `snapToSprintStart` | `(phaseDate, sprintStart, sprintDays) -> Date` | Snap phase date to sprint boundary |

Internal (not exported):
- `getVelocityForSprint(Date, VelocityPhase[]) -> number`
- `simulateSprints(totalPoints, startDate, sprintDays, VelocityPhase[]) -> SprintBreakdown[]`
- `buildScenario(totalPoints, startDate, sprintDays, VelocityPhase[]) -> Scenario`
- `applyBuffer(VelocityPhase[], factor) -> VelocityPhase[]`

### evm.ts

| Function | Signature | Purpose |
|----------|-----------|---------|
| `calculateEvmMetrics` | `(totalPoints, CompletedSprint[], Scenario) -> EvmMetrics \| null` | EVM health metrics |

EVM Formulas:
- BAC = totalPoints
- EV = sum of actual points
- PV = sum of planned points for completed sprint count
- SV = EV - PV, SPI = EV / PV
- EAC(t) = completed + ceil(remaining / actualVelocityAvg)
- TCPI = remaining / remainingPlannedCapacity

### velocity-stats.ts

| Function | Signature | Purpose |
|----------|-----------|---------|
| `calcVelocityStats` | `(number[]) -> VelocityStats` | Average, stdDev, CV%, min, max |

### export.ts

| Function | Signature | Purpose |
|----------|-----------|---------|
| `toCsv` | `(Scenario) -> string` | Generate CSV content with BOM |
| `downloadCsv` | `(csv, filename) -> void` | Trigger browser download |

### share.ts

| Function | Signature | Purpose |
|----------|-----------|---------|
| `encodeState` | `(SavedState) -> string` | URL-safe base64 encode |
| `decodeState` | `(string) -> SavedState \| null` | Decode + validate |

### storage.ts

| Function | Signature | Purpose |
|----------|-----------|---------|
| `saveState` | `(SavedState) -> void` | Write to localStorage |
| `loadState` | `() -> SavedState \| null` | Read + validate from localStorage |

### utils.ts

| Function | Signature | Purpose |
|----------|-----------|---------|
| `cn` | `(...ClassValue[]) -> string` | Tailwind class merge (clsx + twMerge) |
| `roundPt` | `(number) -> number` | Round to 1 decimal place |
