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
import { format } from "date-fns"
import type { Scenario } from "@/lib/types"

type SprintTableProps = {
  readonly scenario: Scenario
}

export function SprintTable({ scenario }: SprintTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Sprint Breakdown (Standard)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Sprint</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Velocity</TableHead>
                <TableHead className="text-right">Burned</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
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
                  <TableCell className="text-right">
                    {sprint.velocity}
                  </TableCell>
                  <TableCell className="text-right">
                    {sprint.pointsBurned}
                  </TableCell>
                  <TableCell className="text-right">
                    {sprint.remainingPoints}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
