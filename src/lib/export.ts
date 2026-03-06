import { format } from "date-fns"
import type { Scenario } from "./types"

const DATE_FORMAT = "yyyy/MM/dd"

export function toCsv(scenario: Scenario): string {
  const header = "スプリント,開始日,終了日,ベロシティ,消化ポイント,残りポイント"
  const rows = scenario.sprints.map((s) =>
    [
      `S${s.sprintNumber}`,
      format(s.startDate, DATE_FORMAT),
      format(s.endDate, DATE_FORMAT),
      s.velocity,
      s.pointsBurned,
      s.remainingPoints,
    ].join(",")
  )
  return [header, ...rows].join("\n")
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
