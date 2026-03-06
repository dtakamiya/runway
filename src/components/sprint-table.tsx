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
import { format } from "date-fns"
import type { ForecastResult, Scenario } from "@/lib/types"

type SprintTableProps = {
  readonly result: ForecastResult
}

function ScenarioTable({ scenario }: { readonly scenario: Scenario }) {
  return (
    <div className="overflow-x-auto">
      <Table>
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
                {format(sprint.startDate, "MM/dd")} -{" "}
                {format(sprint.endDate, "MM/dd")}
              </TableCell>
              <TableCell className="text-right">{sprint.velocity}</TableCell>
              <TableCell className="text-right">{sprint.pointsBurned}</TableCell>
              <TableCell className="text-right">
                {sprint.remainingPoints}
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
              楽観 ({result.optimistic.sprintCount} Sprint)
            </TabsTrigger>
            <TabsTrigger value="standard">
              標準 ({result.standard.sprintCount} Sprint)
            </TabsTrigger>
            <TabsTrigger value="pessimistic">
              悲観 ({result.pessimistic.sprintCount} Sprint)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="optimistic">
            <ScenarioTable scenario={result.optimistic} />
          </TabsContent>
          <TabsContent value="standard">
            <ScenarioTable scenario={result.standard} />
          </TabsContent>
          <TabsContent value="pessimistic">
            <ScenarioTable scenario={result.pessimistic} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
