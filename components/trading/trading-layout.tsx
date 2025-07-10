"use client"

import { useState } from "react"
import { TradingViewChart } from "./trading-view-chart"
import { AIPositionRecommendations } from "./ai-position-recommendations"
import { QuickTradePanel } from "./quick-trade-panel"
import { MarketOverview } from "./market-overview"
import { Button } from "@/components/ui/button"
import { BarChart3, Brain } from "lucide-react"

export function TradingLayout() {
  const [selectedToken, setSelectedToken] = useState("SOL/USDC")
  const [chartInterval, setChartInterval] = useState("1D")
  const [showAIPanel, setShowAIPanel] = useState(true)

  return (
    <div className="flex flex-col space-y-4 p-4 h-full">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="flex items-center font-bold text-white text-2xl">
            <BarChart3 className="mr-2 w-6 h-6 text-yellow-400" />
            Advanced Trading
          </h1>
          <div className="flex items-center space-x-2">
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="bg-gray-800 px-3 py-1 border border-yellow-500/30 rounded text-white text-sm"
            >
              <option value="SOL/USDC">SOL/USDC</option>
              <option value="BONK/SOL">BONK/SOL</option>
              <option value="JUP/USDC">JUP/USDC</option>
              <option value="RAY/SOL">RAY/SOL</option>
              <option value="ORCA/USDC">ORCA/USDC</option>
            </select>
            <div className="flex border border-yellow-500/30 rounded overflow-hidden">
              {["1m", "5m", "15m", "1H", "4H", "1D"].map((interval) => (
                <button
                  key={interval}
                  onClick={() => setChartInterval(interval)}
                  className={`px-3 py-1 text-xs ${chartInterval === interval
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`border-yellow-500/50 ${showAIPanel ? "bg-yellow-600/20 text-yellow-400" : "text-yellow-400"}`}
          >
            <Brain className="mr-1 w-4 h-4" />
            AI Analysis
          </Button>
        </div>
      </div>

      {/* Main Trading Interface */}
      <div className="flex-1 gap-4 grid grid-cols-12 min-h-0">
        {/* Left Sidebar - Market Overview */}
        <div className="col-span-2">
          <MarketOverview selectedToken={selectedToken} />
        </div>

        {/* Main Chart Area */}
        <div className={`${showAIPanel ? "col-span-7" : "col-span-8"} flex flex-col`}>
          <TradingViewChart
            symbol={selectedToken}
            interval={chartInterval}
            onPositionRecommendation={(recommendation) => {
              // Handle AI position recommendations
              console.log("AI Recommendation:", recommendation)
            }}
          />
        </div>

        {/* Right Sidebar - AI Recommendations */}
        {showAIPanel && (
          <div className="flex flex-col space-y-4 col-span-3">
            <AIPositionRecommendations symbol={selectedToken} interval={chartInterval} />
          </div>
        )}

        {/* Quick Trade Panel */}
        <div className={`${showAIPanel ? "col-span-3" : "col-span-2"} flex flex-col`}>
          <QuickTradePanel selectedToken={selectedToken} />
        </div>
      </div>
    </div>
  )
}
