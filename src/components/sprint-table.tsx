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
          {scenario.sprints.map((sprint) => (
            <TableRow key={sprint.sprintNumber}>
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
  )
}

export function SprintTable({ result }: SprintTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">スプリント詳細</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="standard">
          <TabsList>
            <TabsTrigger value="optimistic">
              楽観 ({result.optimistic.sprintCount} スプリント)
            </TabsTrigger>
            <TabsTrigger value="standard">
              標準 ({result.standard.sprintCount} スプリント)
            </TabsTrigger>
            <TabsTrigger value="pessimistic">
              悲観 ({result.pessimistic.sprintCount} スプリント)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="optimistic">
            <ScenarioTable scenario={result.optimistic} label="楽観" />
          </TabsContent>
          <TabsContent value="standard">
            <ScenarioTable scenario={result.standard} label="標準" />
          </TabsContent>
          <TabsContent value="pessimistic">
            <ScenarioTable scenario={result.pessimistic} label="悲観" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
