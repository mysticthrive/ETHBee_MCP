"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MarketOverviewProps {
  selectedToken: string
}

export function MarketOverview({ selectedToken }: MarketOverviewProps) {
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading market data
    setLoading(true)
    const timer = setTimeout(() => {
      // Mock token data
      const mockTokens = [
        { symbol: "SOL/USDC", price: 143.25, change: 2.4, volume: "12.5M" },
        { symbol: "BONK/USDC", price: 0.000023, change: -3.2, volume: "8.7M" },
        { symbol: "JUP/USDC", price: 1.23, change: 5.7, volume: "4.2M" },
        { symbol: "RAY/USDC", price: 0.87, change: -1.2, volume: "2.1M" },
        { symbol: "ORCA/USDC", price: 1.45, change: 0.8, volume: "1.8M" },
        { symbol: "MNGO/USDC", price: 0.042, change: 7.3, volume: "950K" },
        { symbol: "SBR/USDC", price: 0.31, change: -0.5, volume: "720K" },
        { symbol: "SAMO/USDC", price: 0.0087, change: 3.1, volume: "650K" },
      ]
      setTokens(mockTokens)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="h-full bg-gray-900/50 border border-yellow-500/20 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-yellow-500/20">
        <h3 className="text-white font-semibold">Market Overview</h3>
        <p className="text-gray-400 text-sm">Top Solana tokens</p>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <div>
            {tokens.map((token, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer ${
                  token.symbol === selectedToken ? "bg-yellow-900/20" : ""
                }`}
              >
                <div>
                  <div className="text-white font-medium">{token.symbol.split("/")[0]}</div>
                  <div className="text-gray-400 text-xs">Vol: {token.volume}</div>
                </div>
                <div className="text-right">
                  <div className="text-white">
                    ${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(2)}
                  </div>
                  <div className={`flex items-center text-xs ${token.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {token.change >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {token.change >= 0 ? "+" : ""}
                    {token.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
