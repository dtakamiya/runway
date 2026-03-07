import React from "react"
import { render, screen } from "@testing-library/react"
import { EvmIndicators } from "../evm-indicators"
import type { EvmMetrics } from "@/lib/types"

const baseMetrics: EvmMetrics = {
  bac: 100,
  pv: 40,
  ev: 40,
  sv: 0,
  svPercent: 0,
  spi: 1.0,
  eacSprints: 5,
  tcpi: 1.0,
  completedSprintCount: 2,
  actualVelocityAvg: 20,
}

describe("EvmIndicators", () => {
  it("指標が正しく表示される", () => {
    render(<EvmIndicators metrics={baseMetrics} />)
    expect(screen.getByTestId("evm-indicators")).toBeInTheDocument()
    expect(screen.getByTestId("evm-spi")).toHaveTextContent("1.00")
    expect(screen.getByTestId("evm-sv")).toHaveTextContent("0 pt (0%)")
    expect(screen.getByTestId("evm-eac")).toHaveTextContent("S5")
    expect(screen.getByTestId("evm-tcpi")).toHaveTextContent("1.00")
  })

  it("遅延時に正しいサマリーを表示する", () => {
    const delayedMetrics: EvmMetrics = {
      ...baseMetrics,
      ev: 32,
      sv: -8,
      svPercent: -20,
      spi: 0.8,
      eacSprints: 7,
      tcpi: 1.27,
    }
    render(<EvmIndicators metrics={delayedMetrics} />)
    expect(screen.getByTestId("evm-summary")).toHaveTextContent(
      "計画より8 pt 遅れています。残り約5スプリントで完了見込みです。"
    )
  })

  it("前倒し時に正しいサマリーを表示する", () => {
    const aheadMetrics: EvmMetrics = {
      ...baseMetrics,
      ev: 50,
      sv: 10,
      svPercent: 25,
      spi: 1.25,
      eacSprints: 4,
    }
    render(<EvmIndicators metrics={aheadMetrics} />)
    expect(screen.getByTestId("evm-summary")).toHaveTextContent(
      "計画より10 pt 前倒しで進んでいます。"
    )
  })

  it("SVが正の場合に+符号が付く", () => {
    const aheadMetrics: EvmMetrics = {
      ...baseMetrics,
      ev: 50,
      sv: 10,
      svPercent: 25,
      spi: 1.25,
    }
    render(<EvmIndicators metrics={aheadMetrics} />)
    expect(screen.getByTestId("evm-sv")).toHaveTextContent("+10 pt (+25%)")
  })

  it("TCPI が null のとき '-' を表示する", () => {
    const completedMetrics: EvmMetrics = {
      ...baseMetrics,
      tcpi: null,
    }
    render(<EvmIndicators metrics={completedMetrics} />)
    expect(screen.getByTestId("evm-tcpi")).toHaveTextContent("-")
  })
})
