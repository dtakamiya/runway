"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

export type PhaseFormData = {
  readonly id: string
  readonly fromDate: string
  readonly velocity: string
  readonly label: string
}

type VelocityPhasesProps = {
  readonly phases: readonly PhaseFormData[]
  readonly onChange: (phases: readonly PhaseFormData[]) => void
}

export function VelocityPhases({ phases, onChange }: VelocityPhasesProps) {
  const addPhase = () => {
    const newPhase: PhaseFormData = {
      id: crypto.randomUUID(),
      fromDate: "",
      velocity: "",
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          Velocity Phases
          <Button type="button" variant="outline" size="sm" onClick={addPhase}>
            <Plus className="h-4 w-4 mr-1" />
            Add Phase
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className="grid grid-cols-[1fr_80px_1fr_auto] gap-2 items-end"
          >
            <div>
              <Label className="text-xs">
                {index === 0 ? "Start Date" : "Change Date"}
              </Label>
              <Input
                type="date"
                value={phase.fromDate}
                onChange={(e) =>
                  updatePhase(phase.id, "fromDate", e.target.value)
                }
              />
            </div>
            <div>
              <Label className="text-xs">Velocity</Label>
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
            <div>
              <Label className="text-xs">Memo</Label>
              <Input
                placeholder="e.g. 3-person team"
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
              className="mb-0.5"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        {phases.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add at least one velocity phase to begin forecasting.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
