"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, AlertTriangle, Info } from "lucide-react"
import { useUser } from "@/store/hooks"
import { getUserTimezone, formatTimeInTimezone } from "@/lib/utils/format-utils"

interface AIPositionRecommendationsProps {
  symbol: string
  interval: string
}

export function AIPositionRecommendations({ symbol, interval }: AIPositionRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = useUser()
  const timezone = user?.timezone || getUserTimezone()

  useEffect(() => {
    // Simulate loading AI recommendations
    setLoading(true)
    const timer = setTimeout(() => {
      // Mock AI recommendations based on symbol and interval
      const mockRecommendations = [
        {
          id: 1,
          type: "buy",
          confidence: 0.85,
          price: symbol.includes("SOL") ? 143.25 : symbol.includes("BONK") ? 0.000023 : 5.67,
          reason: "Golden cross detected on 4H timeframe with increasing volume",
          indicators: {
            rsi: 42,
            macd: "bullish",
            sma: "uptrend",
            volume: "increasing",
          },
          timestamp: new Date(),
        },
        {
          id: 2,
          type: "hold",
          confidence: 0.65,
          price: symbol.includes("SOL") ? 143.25 : symbol.includes("BONK") ? 0.000023 : 5.67,
          reason: "Consolidation pattern forming, wait for breakout confirmation",
          indicators: {
            rsi: 55,
            macd: "neutral",
            sma: "sideways",
            volume: "average",
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
        },
      ]
      setRecommendations(mockRecommendations)
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [symbol, interval])

  return (
    <div className="flex flex-col bg-gray-900/50 border border-yellow-500/20 rounded-lg h-full overflow-hidden">
      <div className="p-4 border-yellow-500/20 border-b">
        <h3 className="font-semibold text-white">AI Position Recommendations</h3>
        <p className="text-gray-400 text-sm">Smart trading signals for {symbol}</p>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="border-yellow-400 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`p-4 rounded-lg ${rec.type === "buy"
                    ? "bg-green-900/20 border border-green-500/30"
                    : rec.type === "sell"
                      ? "bg-red-900/20 border border-red-500/30"
                      : "bg-blue-900/20 border border-blue-500/30"
                  }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    {rec.type === "buy" ? (
                      <TrendingUp className="mr-2 w-5 h-5 text-green-400" />
                    ) : rec.type === "sell" ? (
                      <TrendingDown className="mr-2 w-5 h-5 text-red-400" />
                    ) : (
                      <AlertTriangle className="mr-2 w-5 h-5 text-blue-400" />
                    )}
                    <span
                      className={`font-semibold ${rec.type === "buy" ? "text-green-400" : rec.type === "sell" ? "text-red-400" : "text-blue-400"
                        }`}
                    >
                      {rec.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-black/30 px-2 py-1 rounded text-xs">
                    <span className="text-white">{Math.round(rec.confidence * 100)}% confidence</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 text-sm">Price</span>
                    <span className="text-white text-sm">
                      ${rec.price < 0.01 ? rec.price.toFixed(6) : rec.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Time</span>
                    <span className="text-white text-sm">{formatTimeInTimezone(new Date(rec.timestamp), timezone, { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>

                <div className="mb-3 text-gray-300 text-sm">
                  <Info className="inline mr-1 w-4 h-4 text-gray-400" />
                  {rec.reason}
                </div>

                <div className="gap-2 grid grid-cols-2 mb-3">
                  <div className="bg-black/30 p-2 rounded">
                    <div className="text-gray-400 text-xs">RSI</div>
                    <div
                      className={`text-sm ${rec.indicators.rsi < 30
                          ? "text-green-400"
                          : rec.indicators.rsi > 70
                            ? "text-red-400"
                            : "text-white"
                        }`}
                    >
                      {rec.indicators.rsi}
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded">
                    <div className="text-gray-400 text-xs">MACD</div>
                    <div
                      className={`text-sm ${rec.indicators.macd === "bullish"
                          ? "text-green-400"
                          : rec.indicators.macd === "bearish"
                            ? "text-red-400"
                            : "text-white"
                        }`}
                    >
                      {rec.indicators.macd}
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded">
                    <div className="text-gray-400 text-xs">SMA</div>
                    <div
                      className={`text-sm ${rec.indicators.sma === "uptrend"
                          ? "text-green-400"
                          : rec.indicators.sma === "downtrend"
                            ? "text-red-400"
                            : "text-white"
                        }`}
                    >
                      {rec.indicators.sma}
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded">
                    <div className="text-gray-400 text-xs">Volume</div>
                    <div
                      className={`text-sm ${rec.indicators.volume === "increasing"
                          ? "text-green-400"
                          : rec.indicators.volume === "decreasing"
                            ? "text-red-400"
                            : "text-white"
                        }`}
                    >
                      {rec.indicators.volume}
                    </div>
                  </div>
                </div>

                <button
                  className={`w-full py-2 rounded font-medium ${rec.type === "buy"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : rec.type === "sell"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  {rec.type === "buy" ? "Buy Now" : rec.type === "sell" ? "Sell Now" : "Set Alert"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
