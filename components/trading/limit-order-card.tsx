"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUp, ArrowDown, Clock, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LimitOrderProps {
  order: {
    id: string
    type: "buy" | "sell" | "swap"
    tokenSymbol: string
    tokenAddress?: string
    targetPrice: number
    amount: number
    status: "active" | "triggered" | "cancelled" | "expired"
    createdAt: Date
    currentPrice?: number
    toTokenSymbol?: string
  }
  onCancel?: (id: string) => void
}

export function LimitOrderCard({ order, onCancel }: LimitOrderProps) {
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [priceDifference, setPriceDifference] = useState<number | null>(null)

  // Update time ago
  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date()
      const diffMs = now.getTime() - new Date(order.createdAt).getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)

      if (diffDay > 0) {
        setTimeAgo(`${diffDay}d ago`)
      } else if (diffHour > 0) {
        setTimeAgo(`${diffHour}h ago`)
      } else if (diffMin > 0) {
        setTimeAgo(`${diffMin}m ago`)
      } else {
        setTimeAgo(`${diffSec}s ago`)
      }
    }

    updateTimeAgo()
    const intervalId = setInterval(updateTimeAgo, 60000) // Update every minute
    return () => clearInterval(intervalId)
  }, [order.createdAt])

  // Calculate price difference
  useEffect(() => {
    if (order.currentPrice && order.targetPrice) {
      const diff = ((order.currentPrice - order.targetPrice) / order.targetPrice) * 100
      setPriceDifference(diff)
    }
  }, [order.currentPrice, order.targetPrice])

  // Format price based on its magnitude
  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return "N/A"

    if (price === 0) return "$0.00"
    if (price < 0.0001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    if (price < 10) return `$${price.toFixed(2)}`
    if (price < 1000) return `$${price.toFixed(2)}`
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={`rounded-lg border ${order.status === "active"
        ? order.type === "buy"
          ? "border-blue-500/30 bg-blue-500/10"
          : "border-red-500/30 bg-red-500/10"
        : order.status === "triggered"
          ? "border-green-500/30 bg-green-500/10"
          : "border-gray-500/30 bg-gray-700/20"
        } p-2 text-xs`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center">
          {order.type === "buy" ? (
            <ArrowDown className="mr-1 w-3 h-3 text-blue-400" />
          ) : (
            <ArrowUp className="mr-1 w-3 h-3 text-red-400" />
          )}
          <span className="font-medium text-white">
            {order.type === "buy" ? "Buy" : "Sell"} {order.amount} {order.tokenSymbol}
          </span>
        </div>
        <div
          className={`px-1.5 py-0.5 rounded-full text-[10px] ${order.status === "active"
            ? "bg-blue-500/20 text-blue-300"
            : order.status === "triggered"
              ? "bg-green-500/20 text-green-300"
              : "bg-gray-500/20 text-gray-300"
            }`}
        >
          {order.status === "active" ? (
            <span className="flex items-center">
              <Clock className="mr-0.5 w-2 h-2" /> Active
            </span>
          ) : order.status === "triggered" ? (
            <span className="flex items-center">
              <CheckCircle className="mr-0.5 w-2 h-2" /> Executed
            </span>
          ) : (
            <span className="flex items-center">
              <XCircle className="mr-0.5 w-2 h-2" /> Cancelled
            </span>
          )}
        </div>
      </div>

      <div className="gap-1 grid grid-cols-2 mt-2">
        <div>
          <div className="text-gray-400">Target Price</div>
          <div className="font-medium text-white">{formatPrice(order.targetPrice)}</div>
        </div>
        {order.currentPrice && (
          <div>
            <div className="text-gray-400">Current Price</div>
            <div className="font-medium text-white">{formatPrice(order.currentPrice)}</div>
          </div>
        )}
      </div>

      {priceDifference !== null && order.status === "active" && (
        <div className="flex items-center mt-2">
          <div className="mr-1 text-gray-400">Distance:</div>
          <div
            className={`font-medium ${order.type === "buy"
              ? priceDifference > 0
                ? "text-red-400"
                : "text-green-400"
              : priceDifference < 0
                ? "text-red-400"
                : "text-green-400"
              }`}
          >
            {priceDifference > 0 ? "+" : ""}
            {priceDifference.toFixed(2)}%
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-2 pt-2 border-gray-700 border-t">
        <div className="flex items-center text-gray-400">
          <Clock className="mr-1 w-3 h-3" />
          {timeAgo}
        </div>
        {order.status === "active" && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-red-900/30 px-2 h-6 text-[10px] text-gray-400 hover:text-white"
            onClick={() => onCancel(order.id)}
          >
            Cancel
          </Button>
        )}
      </div>
    </motion.div>
  )
}
