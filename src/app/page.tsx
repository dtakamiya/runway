"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { parseISO } from "date-fns"
import { ForecastForm, type FormData } from "@/components/forecast-form"
import {
  VelocityPhases,
  type PhaseFormData,
} from "@/components/velocity-phases"
import { ForecastResultCards } from "@/components/forecast-result"
import { SprintTable } from "@/components/sprint-table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { calculateForecast } from "@/lib/forecast"
import type { ForecastInput, ForecastResult, VelocityPhase } from "@/lib/types"

const BurndownChart = dynamic(
  () =>
    import("@/components/burndown-chart").then((mod) => mod.BurndownChart),
  { ssr: false }
)

function formatDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const initialFormData: FormData = {
  totalPoints: "100",
  startDate: "2026-03-10",
  sprintDays: "14",
  bufferPercent: "20",
}

const initialPhases: readonly PhaseFormData[] = [
  {
    id: crypto.randomUUID(),
    fromDate: "2026-03-10",
    velocity: "15",
    label: "3人チーム",
  },
]

export default function Home() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [phases, setPhases] = useState<readonly PhaseFormData[]>(initialPhases)
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const velocityPhases: readonly VelocityPhase[] = useMemo(() => {
    return phases
      .filter((p) => p.fromDate && p.velocity)
      .map((p) => ({
        fromDate: parseISO(p.fromDate),
        velocity: Number(p.velocity),
        label: p.label || undefined,
      }))
  }, [phases])

  const handleCalculate = () => {
    setError(null)

    const totalPoints = Number(formData.totalPoints)
    const sprintDays = Number(formData.sprintDays)
    const bufferPercent = Number(formData.bufferPercent)

    if (!totalPoints || totalPoints <= 0) {
      setError("ストーリーポイントの合計は正の数である必要があります。")
      return
    }
    if (!formData.startDate) {
      setError("開始日は必須です。")
      return
    }
    if (velocityPhases.length === 0) {
      setError("少なくとも1つのベロシティフェーズが必要です。")
      return
    }
    if (velocityPhases.some((p) => p.velocity <= 0)) {
      setError("すべてのベロシティは正の数である必要があります。")
      return
    }

    const input: ForecastInput = {
      totalPoints,
      startDate: parseISO(formData.startDate),
      sprintDays,
      velocityPhases,
      bufferPercent,
    }

    setResult(calculateForecast(input))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Runway</h1>
          <p className="text-sm text-muted-foreground">
            ベロシティフェーズによるスプリント完了予測
          </p>
        </div>

        <Separator />

        <ForecastForm data={formData} onChange={setFormData} />
        <VelocityPhases phases={phases} onChange={setPhases} />

        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}

        <Button onClick={handleCalculate} className="w-full" size="lg">
          予測を計算
        </Button>

        {result && (
          <div className="space-y-6">
            <Separator />
            <ForecastResultCards result={result} />
            <BurndownChart result={result} velocityPhases={velocityPhases} />
            <SprintTable scenario={result.standard} />
          </div>
        )}
      </div>
    </div>
  )
}
