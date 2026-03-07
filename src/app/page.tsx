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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plane } from "lucide-react"
import { calculateForecast } from "@/lib/forecast"
import { saveState, loadState } from "@/lib/storage"
import { encodeState, decodeState } from "@/lib/share"
import { VelocityHistory } from "@/components/velocity-history"
import { CompletedSprints, type CompletedSprintFormData } from "@/components/completed-sprints"
import { ThemeToggle } from "@/components/theme-toggle"
import { Link, ChevronDown, ChevronUp, BarChart2, AlertCircle, RotateCcw } from "lucide-react"
import type { ForecastInput, ForecastResult, VelocityPhase, CompletedSprint } from "@/lib/types"

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
  const [restoredFromStorage, setRestoredFromStorage] = useState<'storage' | 'url' | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [showVelocityHistory, setShowVelocityHistory] = useState(false)
  const [showCompletedSprints, setShowCompletedSprints] = useState(false)
  const [completedSprintForms, setCompletedSprintForms] = useState<readonly CompletedSprintFormData[]>([])

  // 初回マウント時: URLパラメータ優先、次にlocalStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get("s")
    if (encoded) {
      const decoded = decodeState(encoded)
      if (decoded) {
        setFormData({ ...initialFormData, ...decoded.formData })
        if (decoded.phases.length > 0) {
          setPhases(decoded.phases.map((p) => ({ ...p, id: p.id || crypto.randomUUID() })))
        }
        if (decoded.completedSprints && decoded.completedSprints.length > 0) {
          setCompletedSprintForms(decoded.completedSprints.map((s) => ({ ...s, id: s.id || crypto.randomUUID() })))
        }
        setRestoredFromStorage('url')
        return
      }
    }
    const saved = loadState()
    if (saved) {
      setFormData({ ...initialFormData, ...saved.formData })
      if (saved.phases.length > 0) {
        setPhases(saved.phases.map((p) => ({ ...p, id: p.id || crypto.randomUUID() })))
      }
      if (saved.completedSprints && saved.completedSprints.length > 0) {
        setCompletedSprintForms(saved.completedSprints.map((s) => ({ ...s, id: s.id || crypto.randomUUID() })))
      }
      setRestoredFromStorage('storage')
    } else {
      // 保存データがない場合でも再レンダリングを促し、Selectを正しく表示する
      setFormData({ ...initialFormData })
    }
  }, [])

  // 状態が変わるたびにlocalStorageに保存
  useEffect(() => {
    saveState({
      formData,
      phases: phases as PhaseFormData[],
      completedSprints: completedSprintForms as CompletedSprintFormData[],
    })
  }, [formData, phases, completedSprintForms])

  const handleShare = async () => {
    const encoded = encodeState({
      formData,
      phases: phases as PhaseFormData[],
      completedSprints: completedSprintForms as CompletedSprintFormData[],
    })
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      // クリップボードへの書き込みが拒否された場合は無視
    }
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

  const completedSprints: readonly CompletedSprint[] = useMemo(() => {
    return completedSprintForms
      .map((s, idx) => ({
        sprintNumber: idx + 1,
        actualPoints: Number(s.actualPoints) || 0,
      }))
      .filter((s) => s.actualPoints > 0)
  }, [completedSprintForms])

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
            <p className="text-xs sm:text-sm text-muted-foreground">
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
          <ThemeToggle />
        </div>

        <Separator />

        {restoredFromStorage !== null && (
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
            <RotateCcw className="h-4 w-4 shrink-0" />
            <span>{restoredFromStorage === 'url' ? '共有URLから設定を復元しました' : '前回の入力内容を復元しました'}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto h-auto px-2 py-1 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                  リセット
                </Button>
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
                      setCompletedSprintForms([])
                      setResult(null)
                      setRestoredFromStorage(null)
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

        <Card>
          <CardHeader className="pb-3">
            <button
              type="button"
              aria-expanded={showVelocityHistory}
              aria-controls="velocity-history-panel"
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => setShowVelocityHistory((v) => !v)}
            >
              <CardTitle className="text-base">過去のベロシティから計算</CardTitle>
              {showVelocityHistory ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showVelocityHistory && (
            <CardContent id="velocity-history-panel" className="pt-0">
              <p className="text-xs text-muted-foreground mb-2">
                過去スプリントのベロシティを入力すると平均値を計算し、第1フェーズに適用できます。
              </p>
              <VelocityHistory onApply={handleVelocityHistoryApply} />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <button
              type="button"
              aria-expanded={showCompletedSprints}
              aria-controls="completed-sprints-panel"
              className="w-full flex items-center justify-between hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => setShowCompletedSprints((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">実績入力</CardTitle>
                {completedSprintForms.length > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">
                    ({completedSprintForms.length}スプリント入力済み)
                  </span>
                )}
              </div>
              {showCompletedSprints ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showCompletedSprints && (
            <CardContent id="completed-sprints-panel" className="pt-0">
              <CompletedSprints
                sprints={completedSprintForms}
                onChange={setCompletedSprintForms}
                startDate={formData.startDate || undefined}
                sprintDays={Number(formData.sprintDays) || 14}
                totalPoints={Number(formData.totalPoints) || undefined}
              />
            </CardContent>
          )}
        </Card>

        {isDirty && !formErrors && !velocityError && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            値が変更されました。再計算してください。
          </div>
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
            <BarChart2 className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm font-medium mb-1">完了予測を確認しましょう</p>
            <p className="text-xs leading-relaxed opacity-75">
              上の「予測を計算」ボタンを押すと
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
            <BurndownChart
              result={result}
              velocityPhases={velocityPhases}
              deadline={formData.deadline || undefined}
              completedSprints={completedSprints}
              totalPoints={Number(formData.totalPoints) || undefined}
            />
            <SprintTable result={result} />
          </div>
        )}
      </div>
    </div>
  )
}
