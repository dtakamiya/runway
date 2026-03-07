"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { toCsv, downloadCsv } from "@/lib/export"
import { roundPt } from "@/lib/utils"
import type { ForecastResult, Scenario } from "@/lib/types"

type SprintTableProps = {
  readonly result: ForecastResult
}

function ScenarioTable({
  scenario,
  label,
}: {
  readonly scenario: Scenario
  readonly label: string
}) {
  const handleExport = () => {
    const csv = toCsv(scenario)
    downloadCsv(csv, `runway-${label}-${format(new Date(), "yyyyMMdd")}.csv`)
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          CSVエクスポート
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">スプリント</TableHead>
              <TableHead>期間</TableHead>
              <TableHead className="text-right">ベロシティ (pt)</TableHead>
              <TableHead className="text-right">消化 (pt)</TableHead>
              <TableHead className="text-right">残り (pt)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenario.sprints.map((sprint, index) => (
              <TableRow
                key={sprint.sprintNumber}
                className={`hover:bg-muted/50 transition-colors${index % 2 === 1 ? " bg-muted/20" : ""}`}
              >
                <TableCell className="font-medium">
                  S{sprint.sprintNumber}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(sprint.startDate, "yyyy/MM/dd")} -{" "}
                  {format(sprint.endDate, "yyyy/MM/dd")}
                </TableCell>
                <TableCell className="text-right">{roundPt(sprint.velocity)}</TableCell>
                <TableCell className="text-right">{roundPt(sprint.pointsBurned)}</TableCell>
                <TableCell className="text-right">
                  {roundPt(sprint.remainingPoints)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

const TAB_CONFIGS = [
  {
    value: "highVelocity" as const,
    label: "好調",
    dot: "bg-green-500",
    activeText: "data-[state=active]:text-green-600",
  },
  {
    value: "standard" as const,
    label: "標準",
    dot: "bg-blue-500",
    activeText: "data-[state=active]:text-blue-600",
  },
  {
    value: "lowVelocity" as const,
    label: "不調",
    dot: "bg-orange-500",
    activeText: "data-[state=active]:text-orange-600",
  },
] as const

export function SprintTable({ result }: SprintTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">スプリント詳細</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="standard">
          <TabsList>
            {TAB_CONFIGS.map((config) => (
              <TabsTrigger
                key={config.value}
                value={config.value}
                className={`gap-1.5 ${config.activeText}`}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${config.dot}`} />
                {config.label}
                <span className="text-xs opacity-60">
                  ({result[config.value].sprintCount})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {TAB_CONFIGS.map((config) => (
            <TabsContent key={config.value} value={config.value}>
              <ScenarioTable scenario={result[config.value]} label={config.label} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
