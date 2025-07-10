"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface QuickTradePanelProps {
  selectedToken: string
}

export function QuickTradePanel({ selectedToken }: QuickTradePanelProps) {
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")
  const [amount, setAmount] = useState("")
  const [orderType, setOrderType] = useState<"market" | "limit">("market")
  const [limitPrice, setLimitPrice] = useState("")

  // Mock token data
  const tokenPrice = selectedToken.includes("SOL")
    ? 143.25
    : selectedToken.includes("BONK")
      ? 0.000023
      : selectedToken.includes("JUP")
        ? 1.23
        : selectedToken.includes("RAY")
          ? 0.87
          : 1.45

  const handlePercentageClick = (percentage: number) => {
    // Mock balance - in a real app, this would come from the user's wallet
    const maxBalance = tradeType === "buy" ? 1000 : selectedToken.includes("SOL") ? 10 : 1000
    setAmount((maxBalance * percentage).toFixed(selectedToken.includes("BONK") ? 6 : 2))
  }

  const calculateTotal = () => {
    const amountNum = Number.parseFloat(amount) || 0
    return tradeType === "buy" ? amountNum / tokenPrice : amountNum * tokenPrice
  }

  const calculateFee = () => {
    return calculateTotal() * 0.0035 // 0.35% fee
  }

  return (
    <div className="h-full bg-gray-900/50 border border-yellow-500/20 rounded-lg overflow-hidden flex flex-col">
      <div className="p-4 border-b border-yellow-500/20">
        <h3 className="text-white font-semibold">Quick Trade</h3>
        <p className="text-gray-400 text-sm">{selectedToken}</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* Trade Type Selector */}
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 flex justify-center items-center ${
              tradeType === "buy" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } rounded-l`}
            onClick={() => setTradeType("buy")}
          >
            <TrendingUp className="w-4 h-4 mr-1" /> Buy
          </button>
          <button
            className={`flex-1 py-2 flex justify-center items-center ${
              tradeType === "sell" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } rounded-r`}
            onClick={() => setTradeType("sell")}
          >
            <TrendingDown className="w-4 h-4 mr-1" /> Sell
          </button>
        </div>

        {/* Order Type */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">Order Type</label>
          <div className="flex">
            <button
              className={`flex-1 py-1.5 text-sm ${
                orderType === "market"
                  ? "bg-yellow-600/20 border-yellow-500/50 text-yellow-400"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } rounded-l border`}
              onClick={() => setOrderType("market")}
            >
              Market
            </button>
            <button
              className={`flex-1 py-1.5 text-sm ${
                orderType === "limit"
                  ? "bg-yellow-600/20 border-yellow-500/50 text-yellow-400"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } rounded-r border`}
              onClick={() => setOrderType("limit")}
            >
              Limit
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-1">
            {tradeType === "buy" ? "Pay" : "Sell"} Amount ({tradeType === "buy" ? "USDC" : selectedToken.split("/")[0]})
          </label>
          <div className="flex">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-l px-3 py-2 text-white"
              placeholder="0.00"
            />
            <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded-r" onClick={() => handlePercentageClick(1)}>
              MAX
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
              onClick={() => handlePercentageClick(0.25)}
            >
              25%
            </button>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
              onClick={() => handlePercentageClick(0.5)}
            >
              50%
            </button>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
              onClick={() => handlePercentageClick(0.75)}
            >
              75%
            </button>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
              onClick={() => handlePercentageClick(1)}
            >
              100%
            </button>
          </div>
        </div>

        {/* Limit Price (conditional) */}
        {orderType === "limit" && (
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Limit Price</label>
            <input
              type="text"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              placeholder={tokenPrice.toString()}
            />
          </div>
        )}

        {/* Summary */}
        <div className="bg-black/30 p-3 rounded mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-sm">Price</span>
            <span className="text-white text-sm">
              ${tokenPrice < 0.01 ? tokenPrice.toFixed(6) : tokenPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-sm">{tradeType === "buy" ? "Receive" : "Receive"} (est.)</span>
            <span className="text-white text-sm">
              {calculateTotal().toFixed(selectedToken.includes("BONK") ? 6 : 4)}{" "}
              {tradeType === "buy" ? selectedToken.split("/")[0] : "USDC"}
            </span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400 text-sm">Fee (0.35%)</span>
            <span className="text-white text-sm">
              {calculateFee().toFixed(selectedToken.includes("BONK") ? 6 : 4)}{" "}
              {tradeType === "buy" ? selectedToken.split("/")[0] : "USDC"}
            </span>
          </div>
        </div>

        {/* Execute Button */}
        <button
          className={`w-full py-2 rounded font-medium ${
            tradeType === "buy"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {tradeType === "buy" ? "Buy" : "Sell"} {selectedToken.split("/")[0]}
        </button>
      </div>
    </div>
  )
}
