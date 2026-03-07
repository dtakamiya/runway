"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EvmMetrics } from "@/lib/types"

type EvmIndicatorsProps = {
  readonly metrics: EvmMetrics
}

function spiColor(spi: number): string {
  if (spi >= 1.0) return "text-green-600 dark:text-green-400"
  if (spi >= 0.85) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

function spiBgColor(spi: number): string {
  if (spi >= 1.0) return "bg-green-50 dark:bg-green-950/30"
  if (spi >= 0.85) return "bg-yellow-50 dark:bg-yellow-950/30"
  return "bg-red-50 dark:bg-red-950/30"
}

function tcpiColor(tcpi: number): string {
  if (tcpi > 1.0) return "text-red-600 dark:text-red-400"
  return "text-foreground"
}

function summaryText(metrics: EvmMetrics): string {
  const { spi, sv, eacSprints, completedSprintCount } = metrics
  if (spi >= 1.0) {
    return `計画より${sv} pt 前倒しで進んでいます。`
  }
  const behind = Math.abs(sv)
  const additionalSprints = eacSprints - completedSprintCount
  return `計画より${behind} pt 遅れています。残り約${additionalSprints}スプリントで完了見込みです。`
}

export function EvmIndicators({ metrics }: EvmIndicatorsProps) {
  const { spi, sv, svPercent, eacSprints, tcpi } = metrics

  return (
    <Card data-testid="evm-indicators" className={spiBgColor(spi)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          プロジェクト健全性 (EVM)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">SPI: </span>
            <span className={`font-bold ${spiColor(spi)}`} data-testid="evm-spi">
              {spi.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">SV: </span>
            <span className={`font-bold ${spiColor(spi)}`} data-testid="evm-sv">
              {sv > 0 ? "+" : ""}{sv} pt ({svPercent > 0 ? "+" : ""}{svPercent}%)
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">完了予測: </span>
            <span className="font-bold" data-testid="evm-eac">
              S{eacSprints}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">TCPI: </span>
            {tcpi !== null ? (
              <span className={`font-bold ${tcpiColor(tcpi)}`} data-testid="evm-tcpi">
                {tcpi.toFixed(2)}
              </span>
            ) : (
              <span className="font-bold text-muted-foreground" data-testid="evm-tcpi">
                -
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground" data-testid="evm-summary">
          {summaryText(metrics)}
        </p>
      </CardContent>
    </Card>
  )
}
