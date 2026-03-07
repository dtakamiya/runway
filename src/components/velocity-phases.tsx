"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { snapToSprintStart } from "@/lib/forecast"

export type PhaseFormData = {
  readonly id: string
  readonly fromDate: string
  readonly velocity: string
  readonly label: string
}

type VelocityPhasesProps = {
  readonly phases: readonly PhaseFormData[]
  readonly onChange: (phases: readonly PhaseFormData[]) => void
  readonly sprintDays?: number
  readonly startDate?: string
}

function formatDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function VelocityPhases({ phases, onChange, sprintDays, startDate }: VelocityPhasesProps) {
  const addPhase = () => {
    const lastPhase = phases[phases.length - 1]

    let defaultFromDate = ""
    if (lastPhase?.fromDate && sprintDays && sprintDays > 0) {
      const [year, month, day] = lastPhase.fromDate.split("-").map(Number)
      const date = new Date(year, month - 1, day)
      date.setDate(date.getDate() + sprintDays * 2)
      defaultFromDate = formatDateString(date)
    }

    const newPhase: PhaseFormData = {
      id: crypto.randomUUID(),
      fromDate: defaultFromDate,
      velocity: lastPhase ? lastPhase.velocity : "",
      label: "",
    }
    onChange([...phases, newPhase])
  }

  const removePhase = (id: string) => {
    onChange(phases.filter((p) => p.id !== id))
  }

  const updatePhase = (
    id: string,
    field: keyof Omit<PhaseFormData, "id">,
    value: string
  ) => {
    onChange(
      phases.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const snapPhaseDate = (id: string, index: number, value: string) => {
    if (index === 0 || !value || !startDate || !sprintDays || sprintDays <= 0) return
    const [sy, sm, sd] = startDate.split("-").map(Number)
    const sprintStartDate = new Date(sy, sm - 1, sd)
    const [py, pm, pd] = value.split("-").map(Number)
    const phaseDate = new Date(py, pm - 1, pd)
    const snapped = snapToSprintStart(phaseDate, sprintStartDate, sprintDays)
    const snappedStr = formatDateString(snapped)
    if (snappedStr !== value) {
      onChange(phases.map((p) => (p.id === id ? { ...p, fromDate: snappedStr } : p)))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          ベロシティフェーズ
          <Button type="button" variant="outline" size="sm" onClick={addPhase}>
            <Plus className="h-4 w-4 mr-1" />
            フェーズを追加
          </Button>
        </CardTitle>
        {phases.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            フェーズ変更日はスプリント開始日単位で適用されます。入力後にスプリント開始日へ自動調整されます。
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {phases.map((phase, index) => (
          <div key={phase.id} className="space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-[1fr_80px_1fr_auto] gap-2 items-end">
              <div>
                <Label className="text-xs">
                  {index === 0 ? "開始日" : "変更日"}
                </Label>
                <Input
                  type="date"
                  value={phase.fromDate}
                  onChange={(e) =>
                    updatePhase(phase.id, "fromDate", e.target.value)
                  }
                  onBlur={(e) => snapPhaseDate(phase.id, index, e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">ベロシティ</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="15"
                  value={phase.velocity}
                  onChange={(e) =>
                    updatePhase(phase.id, "velocity", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label className="text-xs">メモ</Label>
                <Input
                  placeholder="例: 3人チーム"
                  value={phase.label}
                  onChange={(e) =>
                    updatePhase(phase.id, "label", e.target.value)
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePhase(phase.id)}
                disabled={phases.length <= 1}
                className="hidden md:flex mb-0.5 hover:text-destructive"
                aria-label="フェーズを削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-end md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePhase(phase.id)}
                disabled={phases.length <= 1}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                aria-label="フェーズを削除"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                削除
              </Button>
            </div>
          </div>
        ))}
        {phases.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            予測を開始するには少なくとも1つのベロシティフェーズを追加してください。
          </p>
        )}
      </CardContent>
    </Card>
  )
}
