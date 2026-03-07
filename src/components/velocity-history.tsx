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
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <div className="bg-muted rounded-md p-2">
            <p className="text-xs text-muted-foreground">スプリント数</p>
            <p className="font-semibold">{stats.count}</p>
          </div>
          <div className="bg-muted rounded-md p-2">
            <p className="text-xs text-muted-foreground">平均</p>
            <p className="font-semibold">{stats.average}</p>
          </div>
          <div className="bg-muted rounded-md p-2">
            <p className="text-xs text-muted-foreground">最小</p>
            <p className="font-semibold">{stats.min}</p>
          </div>
          <div className="bg-muted rounded-md p-2">
            <p className="text-xs text-muted-foreground">最大</p>
            <p className="font-semibold">{stats.max}</p>
          </div>
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
