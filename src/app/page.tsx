"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { parseISO } from "date-fns"
import { ForecastForm, type FormData, type FormErrors } from "@/components/forecast-form"
import {
  VelocityPhases,
  type PhaseFormData,
} from "@/components/velocity-phases"
import { ForecastResultCards } from "@/components/forecast-result"
import { SprintTable } from "@/components/sprint-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plane } from "lucide-react"
import { calculateForecast } from "@/lib/forecast"
import { saveState, loadState } from "@/lib/storage"
import { encodeState, decodeState } from "@/lib/share"
import { VelocityHistory } from "@/components/velocity-history"
import { Link, ChevronDown, ChevronUp } from "lucide-react"
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
  deadline: "",
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
  const [formErrors, setFormErrors] = useState<FormErrors | null>(null)
  const [velocityError, setVelocityError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [restoredFromStorage, setRestoredFromStorage] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showVelocityHistory, setShowVelocityHistory] = useState(false)

  // 初回マウント時: URLパラメータ優先、次にlocalStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get("s")
    if (encoded) {
      const decoded = decodeState(encoded)
      if (decoded) {
        setFormData({ ...initialFormData, ...decoded.formData })
        if (decoded.phases.length > 0) setPhases(decoded.phases)
        setRestoredFromStorage(true)
        return
      }
    }
    const saved = loadState()
    if (saved) {
      setFormData({ ...initialFormData, ...saved.formData })
      if (saved.phases.length > 0) setPhases(saved.phases)
      setRestoredFromStorage(true)
    }
  }, [])

  // 状態が変わるたびにlocalStorageに保存
  useEffect(() => {
    saveState({ formData, phases: phases as PhaseFormData[] })
  }, [formData, phases])

  const handleShare = async () => {
    const encoded = encodeState({
      formData,
      phases: phases as PhaseFormData[],
    })
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`
    await navigator.clipboard.writeText(url)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleFormChange = (data: FormData) => {
    setFormData(data)
    setFormErrors(null)
    setResult(null)
    setIsDirty(true)
  }

  const handlePhasesChange = (newPhases: readonly PhaseFormData[]) => {
    const sorted = [...newPhases].sort((a, b) => {
      if (!a.fromDate && !b.fromDate) return 0
      if (!a.fromDate) return 1
      if (!b.fromDate) return -1
      return a.fromDate.localeCompare(b.fromDate)
    })
    setPhases(sorted)
    setVelocityError(null)
    setResult(null)
    setIsDirty(true)
  }

  const velocityPhases: readonly VelocityPhase[] = useMemo(() => {
    return phases
      .filter((p) => p.fromDate && p.velocity)
      .map((p) => ({
        fromDate: parseISO(p.fromDate),
        velocity: Number(p.velocity),
        label: p.label || undefined,
      }))
  }, [phases])

  const performCalculate = (overridePhasesData?: readonly PhaseFormData[]) => {
    setFormErrors(null)
    setVelocityError(null)

    const totalPoints = Number(formData.totalPoints)
    const sprintDays = Number(formData.sprintDays)
    const bufferPercent = Number(formData.bufferPercent)

    const newFormErrors: { totalPoints?: string; startDate?: string } = {}
    if (!totalPoints || totalPoints <= 0) {
      newFormErrors.totalPoints = "ストーリーポイントの合計は正の数である必要があります。"
    }
    if (!formData.startDate) {
      newFormErrors.startDate = "開始日は必須です。"
    }
    if (Object.keys(newFormErrors).length > 0) {
      setFormErrors(newFormErrors)
      return
    }

    const resolvedVelocityPhases: readonly VelocityPhase[] = overridePhasesData
      ? overridePhasesData
          .filter((p) => p.fromDate && p.velocity)
          .map((p) => ({
            fromDate: parseISO(p.fromDate),
            velocity: Number(p.velocity),
            label: p.label || undefined,
          }))
      : velocityPhases

    if (resolvedVelocityPhases.length === 0) {
      setVelocityError("少なくとも1つのベロシティフェーズが必要です。")
      return
    }
    if (resolvedVelocityPhases.some((p) => p.velocity <= 0)) {
      setVelocityError("すべてのベロシティは正の数である必要があります。")
      return
    }

    const input: ForecastInput = {
      totalPoints,
      startDate: parseISO(formData.startDate),
      sprintDays,
      velocityPhases: resolvedVelocityPhases,
      bufferPercent,
    }

    setResult(calculateForecast(input))
    setIsDirty(false)
  }

  const handleCalculate = () => {
    performCalculate()
  }

  const handleVelocityHistoryApply = (average: number) => {
    if (phases.length === 0) return
    const updated = phases.map((p, i) =>
      i === 0 ? { ...p, velocity: String(average) } : p
    )
    const sorted = [...updated].sort((a, b) => {
      if (!a.fromDate && !b.fromDate) return 0
      if (!a.fromDate) return 1
      if (!b.fromDate) return -1
      return a.fromDate.localeCompare(b.fromDate)
    })
    setPhases(sorted)
    performCalculate(sorted)
  }

  return (
    <div id="main-content" className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div
            data-testid="brand-logo"
            className="bg-primary text-primary-foreground rounded-lg p-2 flex items-center justify-center"
          >
            <Plane className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Runway</h1>
            <p className="text-sm text-muted-foreground">
              スプリント完了予測ツール
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5"
          >
            <Link className="h-4 w-4" />
            {copySuccess ? "コピーしました！" : "URLをコピー"}
          </Button>
        </div>

        <Separator />

        {restoredFromStorage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            <span>前回の入力内容を復元しました</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="ml-auto text-xs underline hover:text-foreground cursor-pointer">
                  リセット
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>入力内容をリセットしますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消せません。すべての入力内容がデフォルト値に戻ります。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setFormData(initialFormData)
                      setPhases(initialPhases)
                      setResult(null)
                      setRestoredFromStorage(false)
                    }}
                  >
                    リセットする
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        <ForecastForm data={formData} onChange={handleFormChange} errors={formErrors ?? undefined} />
        <VelocityPhases phases={phases} onChange={handlePhasesChange} sprintDays={Number(formData.sprintDays) || undefined} startDate={formData.startDate || undefined} velocityError={velocityError ?? undefined} />

        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            aria-expanded={showVelocityHistory}
            aria-controls="velocity-history-panel"
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => setShowVelocityHistory((v) => !v)}
          >
            <span>過去のベロシティから計算</span>
            {showVelocityHistory ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showVelocityHistory && (
            <div id="velocity-history-panel" className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2">
                過去スプリントのベロシティを入力すると平均値を計算し、第1フェーズに適用できます。
              </p>
              <VelocityHistory onApply={handleVelocityHistoryApply} />
            </div>
          )}
        </div>

        {isDirty && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
            値が変更されました。再計算してください。
          </p>
        )}

        <Button
          onClick={handleCalculate}
          className={`w-full transition-all ${
            isDirty ? "animate-pulse motion-reduce:animate-none ring-2 ring-offset-2 ring-primary" : ""
          }`}
          size="lg"
        >
          予測を計算
        </Button>

        {!result && (
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm leading-relaxed">
              「予測を計算」を押すと
              <br />
              完了予測日・バーンダウンチャートが表示されます
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none motion-reduce:transition-none">
            <Separator />
            <ForecastResultCards
              result={result}
              deadline={formData.deadline || undefined}
            />
            <BurndownChart result={result} velocityPhases={velocityPhases} deadline={formData.deadline || undefined} />
            <SprintTable result={result} />
          </div>
        )}
      </div>
    </div>
  )
}
