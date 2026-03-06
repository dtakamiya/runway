"use client"

import { TrendingUp, Minus, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import type { ForecastResult } from "@/lib/types"

type ForecastResultCardsProps = {
  readonly result: ForecastResult
}

const scenarioConfig = [
  {
    key: "optimistic" as const,
    title: "楽観",
    color: "text-green-600",
    bg: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: TrendingUp,
    emphasis: false,
  },
  {
    key: "standard" as const,
    title: "標準",
    color: "text-blue-600",
    bg: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    icon: Minus,
    emphasis: true,
  },
  {
    key: "pessimistic" as const,
    title: "悲観",
    color: "text-orange-600",
    bg: "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950",
    badge:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: TrendingDown,
    emphasis: false,
  },
] as const

export function ForecastResultCards({ result }: ForecastResultCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {scenarioConfig.map((config) => {
        const scenario = result[config.key]
        const Icon = config.icon
        return (
          <Card
            key={config.key}
            data-scenario={config.key}
            className={`${config.bg} transition-all ${
              config.emphasis
                ? "ring-2 ring-blue-400 shadow-lg md:scale-[1.03]"
                : ""
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle
                className={`text-sm font-medium flex items-center gap-1.5 ${config.color}`}
              >
                <Icon
                  className="h-4 w-4"
                  data-testid={`icon-${config.key}`}
                />
                {config.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">
                {format(scenario.endDate, "yyyy/MM/dd")}
              </p>
              <div className="flex gap-2">
                <Badge variant="secondary" className={config.badge}>
                  {scenario.sprintCount} スプリント
                </Badge>
                <Badge variant="secondary" className={config.badge}>
                  {scenario.totalPoints} pts
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
