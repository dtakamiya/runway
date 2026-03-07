"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type FormData = {
  readonly totalPoints: string
  readonly startDate: string
  readonly sprintDays: string
  readonly bufferPercent: string
  readonly deadline: string
}

type ForecastFormProps = {
  readonly data: FormData
  readonly onChange: (data: FormData) => void
}

export function ForecastForm({ data, onChange }: ForecastFormProps) {
  const update = (field: keyof FormData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">基本設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="totalPoints">ストーリーポイント合計</Label>
            <Input
              id="totalPoints"
              type="number"
              min="1"
              placeholder="100"
              value={data.totalPoints}
              onChange={(e) => update("totalPoints", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate">開始日</Label>
            <Input
              id="startDate"
              type="date"
              value={data.startDate}
              onChange={(e) => update("startDate", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sprintDays">スプリント期間</Label>
            <Select
              value={data.sprintDays}
              onValueChange={(value) => update("sprintDays", value)}
            >
              <SelectTrigger id="sprintDays">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">1週間</SelectItem>
                <SelectItem value="14">2週間</SelectItem>
                <SelectItem value="21">3週間</SelectItem>
                <SelectItem value="28">4週間</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buffer">不確実性バッファー (%)</Label>
            <Input
              id="buffer"
              type="number"
              min="0"
              max="100"
              placeholder="20"
              value={data.bufferPercent}
              onChange={(e) => update("bufferPercent", e.target.value)}
            />
            {Number(data.bufferPercent) > 0 && (
              <p className="text-xs text-muted-foreground">
                悲観：vel -{data.bufferPercent}% / pt +{data.bufferPercent}%
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deadline">デッドライン (任意)</Label>
          <div className="flex gap-2">
            <Input
              id="deadline"
              type="date"
              value={data.deadline}
              onChange={(e) => update("deadline", e.target.value)}
            />
            {data.deadline && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => update("deadline", "")}
              >
                クリア
              </Button>
            )}
          </div>
          {data.deadline && (
            <p className="text-xs text-muted-foreground">
              各シナリオがこの日付に間に合うか判定します
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
