"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { calcVelocityStats } from "@/lib/velocity-stats"

type VelocityHistoryProps = {
  readonly onApply: (average: number) => void
}

export function VelocityHistory({ onApply }: VelocityHistoryProps) {
  const [raw, setRaw] = useState("")

  const velocities = useMemo(() => {
    return raw
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !isNaN(n) && n > 0)
  }, [raw])

  const stats = useMemo(() => calcVelocityStats(velocities), [velocities])

  const isValid = velocities.length > 0

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="velocity-history-input">過去スプリントのベロシティ</Label>
        <Input
          id="velocity-history-input"
          placeholder="例: 20, 18, 22, 25 （カンマ区切り）"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
      </div>

      {isValid && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-muted rounded-md p-2">
              <p className="text-xs text-muted-foreground">スプリント数</p>
              <p className="font-semibold">{stats.count}</p>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-xs text-muted-foreground">平均</p>
              <p className="font-semibold">{stats.average}</p>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-xs text-muted-foreground">最小 / 最大</p>
              <p className="font-semibold">{stats.min} / {stats.max}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-sm">
            <div className="bg-muted rounded-md p-2">
              <p className="text-xs text-muted-foreground">標準偏差 (σ)</p>
              <p className="font-semibold">{stats.stdDev}</p>
            </div>
            <div className={`rounded-md p-2 ${stats.cv >= 30 ? "bg-amber-100 dark:bg-amber-950" : "bg-muted"}`}>
              <p className="text-xs text-muted-foreground">変動係数 (CV%)</p>
              <p className={`font-semibold ${stats.cv >= 30 ? "text-amber-700 dark:text-amber-400" : ""}`}>
                {stats.cv}%
              </p>
            </div>
          </div>
          {stats.cv >= 30 && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              CV% が高め（{stats.cv}%）です。不確実性バッファーを {Math.ceil(stats.cv)}% 以上に設定することを推奨します。
            </p>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!isValid}
        onClick={() => onApply(stats.average)}
      >
        この値を使う
      </Button>
    </div>
  )
}
