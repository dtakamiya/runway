"use client"

import { addDays, format } from "date-fns"
import { parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

export type CompletedSprintFormData = {
  readonly id: string
  readonly actualPoints: string
}

type CompletedSprintsProps = {
  readonly sprints: readonly CompletedSprintFormData[]
  readonly onChange: (sprints: readonly CompletedSprintFormData[]) => void
  readonly startDate?: string
  readonly sprintDays?: number
  readonly totalPoints?: number
}

function getSprintDateRange(
  sprintNumber: number,
  startDate: string,
  sprintDays: number
): { start: string; end: string } {
  const start = addDays(parseISO(startDate), (sprintNumber - 1) * sprintDays)
  const end = addDays(start, sprintDays)
  return {
    start: format(start, "M/d"),
    end: format(end, "M/d"),
  }
}

export function CompletedSprints({
  sprints,
  onChange,
  startDate,
  sprintDays = 14,
  totalPoints,
}: CompletedSprintsProps) {
  const handleAdd = () => {
    onChange([
      ...sprints,
      { id: crypto.randomUUID(), actualPoints: "" },
    ])
  }

  const handleRemove = (id: string) => {
    onChange(sprints.filter((s) => s.id !== id))
  }

  const handleChange = (id: string, value: string) => {
    onChange(
      sprints.map((s) => (s.id === id ? { ...s, actualPoints: value } : s))
    )
  }

  const totalActual = sprints.reduce(
    (sum, s) => sum + (Number(s.actualPoints) || 0),
    0
  )
  const progressPercent =
    totalPoints && totalPoints > 0
      ? Math.min(100, Math.round((totalActual / totalPoints) * 100))
      : null

  return (
    <div className="space-y-3">
      {sprints.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          完了したスプリントの実績ポイントを入力すると、バーンダウンチャートに実績ラインが表示されます。
        </p>
      ) : (
        <div className="space-y-2">
          {sprints.map((sprint, index) => {
            const sprintNumber = index + 1
            const dateRange =
              startDate
                ? getSprintDateRange(sprintNumber, startDate, sprintDays)
                : null

            return (
              <div key={sprint.id} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium w-16 shrink-0">
                    S{sprintNumber}
                  </span>
                  {dateRange && (
                    <span className="text-xs text-muted-foreground w-24 shrink-0">
                      {dateRange.start}〜{dateRange.end}
                    </span>
                  )}
                  <Input
                    type="number"
                    min="0"
                    placeholder="消化pt"
                    value={sprint.actualPoints}
                    onChange={(e) => handleChange(sprint.id, e.target.value)}
                    className="h-8 text-sm w-28"
                    aria-label={`Sprint ${sprintNumber} 実績ポイント`}
                  />
                  <span className="text-xs text-muted-foreground">pt</span>
                </div>
                {index === sprints.length - 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(sprint.id)}
                    aria-label={`Sprint ${sprintNumber} を削除`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="h-7 text-xs gap-1"
        >
          <Plus className="h-3 w-3" />
          スプリントを追加
        </Button>
        {totalActual > 0 && (
          <span className="text-xs text-muted-foreground">
            合計消化: <strong className="text-foreground">{totalActual} pt</strong>
            {progressPercent !== null && (
              <span className="ml-1">({progressPercent}%)</span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
