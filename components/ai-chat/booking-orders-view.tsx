"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Clock,
  TrendingUp,
  Volume2,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Filter,
  Eye,
  X,
  Calendar,
  DollarSign,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWalletConnection } from "@/store/hooks"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { formatDate, formatTimeInTimezone, getUserTimezone } from "@/lib/utils/format-utils"

interface BookingOrder {
  id: string
  user_id: string
  user_wallet?: string
  token_address: string
  token_symbol: string
  action_type: "buy_booking" | "sell_booking" | "notify_booking"
  amount?: number
  conditions: Array<{
    condition_type: string
    condition_details: any
  }>
  logic_type: "AND" | "OR"
  status: "pending" | "executed" | "cancelled" | "expired"
  created_at: string
  updated_at?: string
  executed_at?: string
  expires_at?: string
  tx_hash?: string
  execution_price?: number
  execution_details?: any
  last_checked_at?: string
  check_count?: number
}

interface BookingOrdersViewProps {
  isOpen: boolean
  onClose: () => void
}

// Helper functions
const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="w-3 h-3 text-yellow-400" />
    case "executed":
      return <CheckCircle className="w-3 h-3 text-green-400" />
    case "cancelled":
      return <XCircle className="w-3 h-3 text-red-400" />
    case "expired":
      return <AlertCircle className="w-3 h-3 text-gray-400" />
    default:
      return <Activity className="w-3 h-3 text-gray-400" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
    case "executed":
      return "text-green-400 bg-green-400/10 border-green-400/20"
    case "cancelled":
      return "text-red-400 bg-red-400/10 border-red-400/20"
    case "expired":
      return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20"
  }
}

const getConditionIcon = (conditionType: string) => {
  switch (conditionType) {
    case "price":
      return <TrendingUp className="w-3 h-3 text-blue-400" />
    case "time":
      return <Clock className="w-3 h-3 text-purple-400" />
    case "market":
      return <Volume2 className="w-3 h-3 text-orange-400" />
    default:
      return <Target className="w-3 h-3 text-gray-400" />
  }
}

const formatConditionDetails = (condition: any, timezone: string) => {
  const { condition_type, condition_details } = condition

  if (!condition_details) {
    return `${condition_type} condition`
  }

  switch (condition_type) {
    case "price": {
      const { trigger_type, price, upper_price } = condition_details
      if (trigger_type === "between" && upper_price) {
        return `$${price} - $${upper_price}`
      }
      return `${trigger_type} $${price}`
    }
    case "time": {
      // Normalize time_mode (case-insensitive)
      let time_mode = condition_details.time_mode
      if (typeof time_mode === "string") time_mode = time_mode.toLowerCase()
      const { start_time, end_time, base_time, start_offset_minutes, end_offset_minutes } = condition_details

      if (time_mode === "direct") {
        console.log("⏰start_time");
        console.log(start_time);
        console.log(timezone);
        console.log(formatDate(start_time, true, timezone));
        if (start_time && end_time) {
          const startDate = new Date(start_time)
          const endDate = new Date(end_time)
          return `${formatDate(start_time, true, timezone)} - ${formatDate(end_time, true, timezone)}`
        } else if (start_time) {
          return `After ${formatDate(start_time, true, timezone)}`
        } else if (end_time) {
          return `Before ${formatDate(end_time, true, timezone)}`
        } else {
          return "Direct time condition (no start/end time set)"
        }
      } else if (time_mode === "relative") {
        let baseStr = base_time ? formatDate(base_time, true, timezone) : "base time not set"
        if (start_offset_minutes != null && end_offset_minutes != null) {
          return `From ${start_offset_minutes} min to ${end_offset_minutes} min after ${baseStr}`
        } else if (start_offset_minutes != null) {
          return `At ${start_offset_minutes} min after ${baseStr}`
        } else if (end_offset_minutes != null) {
          return `Within ${end_offset_minutes} min after ${baseStr}`
        } else {
          return `Relative time condition (base: ${baseStr})`
        }
      } else {
        // Fallback for legacy or unknown time_mode
        let details = []
        if (start_time) details.push(`Start: ${formatDate(start_time, true, timezone)}`)
        if (end_time) details.push(`End: ${formatDate(end_time, true, timezone)}`)
        if (base_time) details.push(`Base: ${formatDate(base_time, true, timezone)}`)
        if (start_offset_minutes != null) details.push(`Start offset: ${start_offset_minutes} min`)
        if (end_offset_minutes != null) details.push(`End offset: ${end_offset_minutes} min`)
        return `Time condition (${details.join(", ")})`
      }
    }
    case "market": {
      // Optionally expand for market conditions
      const { metric, value, comparison } = condition_details
      if (metric && value != null && comparison) {
        return `${metric} ${comparison} ${value}`
      }
      return "Market condition"
    }
    default:
      return `${condition_type} condition`
  }
}

// Format address to show first 4 and last 4 characters
const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address || ""
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`
}

export function BookingOrdersView({ isOpen, onClose }: BookingOrdersViewProps) {
  const [orders, setOrders] = useState<BookingOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "executed" | "cancelled" | "expired">("all")
  const [refreshing, setRefreshing] = useState(false)

  const { publicKey } = useWalletConnection()
  const { user } = useSelector((state: RootState) => state.auth)
  const timezone = user?.timezone || getUserTimezone()

  const fetchBookingOrders = async (showRefreshing = false) => {
    if (!user?.id) {
      setError("Please sign in to view booking orders")
      return
    }

    if (showRefreshing) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/booking-orders/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          status: filter === "all" ? undefined : filter,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setOrders(data.data || [])
      } else {
        setError(data.error || "Failed to fetch booking orders")
      }
    } catch (err) {
      setError("Network error occurred while fetching booking orders")
      console.error("Error fetching booking orders:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    console.log(timezone);
  }, [timezone])

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchBookingOrders()
    }
  }, [isOpen, user?.id, filter])

  const cancelOrder = async (orderId: string) => {
    if (!user?.id) {
      setError("User not authenticated")
      return
    }

    try {
      const response = await fetch("/api/booking-orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          user_id: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the orders list
        fetchBookingOrders(true)
      } else {
        setError(data.error || "Failed to cancel order")
      }
    } catch (err) {
      setError("Network error occurred while cancelling order")
      console.error("Error cancelling order:", err)
    }
  }

  const filteredOrders = orders.filter((order) => filter === "all" || order.status === filter)

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? "0%" : "100%" }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="top-0 right-0 z-10 absolute flex flex-col bg-black/90 shadow-2xl shadow-yellow-500/10 backdrop-blur-xl border-yellow-400/40 border-l-2 w-96 h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-4 border-yellow-400/30 border-b">
        <div className="flex flex-1 items-center space-x-2 min-w-0">
          <Eye className="flex-shrink-0 w-5 h-5 text-yellow-400" />
          <h2 className="font-bold text-yellow-100 text-lg truncate">My Booking Orders</h2>
          <span className="flex-shrink-0 bg-yellow-500/20 px-2 py-1 rounded-full font-medium text-yellow-300 text-xs">
            {filteredOrders.length}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBookingOrders(true)}
            disabled={refreshing}
            className="bg-yellow-500/10 hover:bg-yellow-500/20 px-2 border-yellow-400/60 text-yellow-300 hover:text-yellow-200 text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-yellow-500/10 p-1 text-yellow-300 hover:text-yellow-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 p-3 border-yellow-400/20 border-b">
        <Filter className="flex-shrink-0 mr-1 w-4 h-4 text-yellow-400" />
        {(["all", "pending", "executed", "cancelled", "expired"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 flex-shrink-0 ${filter === status
              ? "bg-yellow-500/30 text-yellow-200 border border-yellow-400/50 shadow-lg shadow-yellow-500/20"
              : "text-yellow-300/80 hover:text-yellow-200 hover:bg-yellow-500/10 border border-transparent"
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
        {loading ? (
          <div className="flex justify-center items-center bg-black/10 py-12 rounded-md">
            <RefreshCw className="mr-3 w-6 h-6 text-yellow-400 animate-spin" />
            <span className="text-yellow-200">Loading booking orders...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center bg-red-500/10 py-12 border border-red-400/30 rounded-md">
            <AlertCircle className="mb-3 w-8 h-8 text-red-400" />
            <span className="text-red-300 text-center">{error}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col justify-center items-center bg-yellow-500/5 py-12 border border-yellow-400/20 rounded-md">
            <Eye className="mb-4 w-12 h-12 text-yellow-400/60" />
            <h3 className="mb-2 font-semibold text-yellow-200 text-lg">No booking orders found</h3>
            <p className="text-yellow-300/70 text-sm text-center leading-relaxed">
              {filter === "all"
                ? "You haven't created any booking orders yet. Try creating a conditional order in the chat!"
                : `No ${filter} booking orders found. Try a different filter.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <BookingOrderCard key={order.id} order={order} onCancel={cancelOrder} timezone={timezone} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface BookingOrderCardProps {
  order: BookingOrder
  onCancel: (orderId: string) => void
  timezone: string
}

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-1 rounded-md hover:bg-yellow-500/20 transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-yellow-400" />}
    </button>
  )
}

function BookingOrderCard({ order, onCancel, timezone }: BookingOrderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-yellow-500/5 to-amber-500/5 shadow-sm hover:shadow-yellow-500/10 backdrop-blur-sm border border-yellow-400/20 hover:border-yellow-400/40 rounded-md overflow-hidden transition-all duration-300"
    >
      {/* Header with Status and Action Type */}
      <div className="flex justify-between items-center bg-black/20 px-2 py-1.5 border-yellow-400/10 border-b rounded-t-md">
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border ${getStatusColor(order.status)}`}
          >
            {getStatusIcon(order.status)}
            <span className="font-semibold text-xs uppercase">{order.status}</span>
          </div>
          <h3 className="font-bold text-yellow-100 text-xs">{order.action_type.replace("_", " ").toUpperCase()}</h3>
        </div>
        {order.status === "pending" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(order.id)}
            className="bg-red-500/10 hover:bg-red-500/20 px-2 border-red-400/60 rounded h-6 text-red-300 hover:text-red-200 text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
      <div className="space-y-1 p-1.5">
        {/* Token Info */}
        {order.amount && (
          <div className="flex items-center bg-black/20 p-1.5 rounded">
            <span className="mr-1 font-medium text-yellow-100 text-xs">
              {order.amount} {order.token_symbol}
            </span>
            <span className="text-yellow-300/70 text-xs">({formatAddress(order.token_address)})</span>
            <CopyButton text={order.token_address} className="ml-1" />
          </div>
        )}
        {/* Dates and Price */}
        <div className="gap-1 grid grid-cols-2 text-xs">
          <div className="flex items-center space-x-1 bg-black/20 p-1.5 rounded">
            <Calendar className="flex-shrink-0 w-3 h-3 text-yellow-400" />
            <div>
              <span className="text-yellow-300/80">Created:</span>
              <span className="ml-1 text-yellow-100">{formatDate(order.created_at, false, timezone)}</span>
            </div>
          </div>
          {order.expires_at && (
            <div className="flex items-center space-x-1 bg-black/20 p-1.5 rounded">
              <Clock className="flex-shrink-0 w-3 h-3 text-orange-400" />
              <div>
                <span className="text-yellow-300/80">Expires:</span>
                <span className="ml-1 text-yellow-100">{formatDate(order.expires_at, false, timezone)}</span>
              </div>
            </div>
          )}
        </div>
        {order.execution_price && (
          <div className="flex items-center space-x-1 bg-black/20 p-1.5 rounded">
            <DollarSign className="flex-shrink-0 w-3 h-3 text-green-400" />
            <span className="text-yellow-300/80">Price:</span>
            <span className="font-medium text-green-200">${order.execution_price.toFixed(4)}</span>
          </div>
        )}
        {order.tx_hash && (
          <div className="flex justify-between items-center bg-black/20 p-1.5 rounded">
            <div className="flex items-center space-x-1 overflow-hidden">
              <Activity className="flex-shrink-0 w-3 h-3 text-blue-400" />
              <span className="text-blue-300 text-xs whitespace-nowrap">Tx:</span>
              <span className="font-mono text-blue-200 text-xs truncate">{formatAddress(order.tx_hash)}</span>
            </div>
            <CopyButton text={order.tx_hash} />
          </div>
        )}
        {/* Conditions */}
        {order.conditions.length > 0 && (
          <div className="bg-black/20 p-1.5 rounded">
            <div className="flex items-center space-x-1 mb-1">
              <Target className="flex-shrink-0 w-3 h-3 text-yellow-400" />
              <span className="font-medium text-yellow-100 text-xs">
                {order.conditions.length} {order.conditions.length === 1 ? "Condition" : "Conditions"} (
                {order.logic_type})
              </span>
            </div>
            <div className="space-y-1">
              {order.conditions.map((condition, index) => (
                <div key={index} className="bg-black/30 p-1 border border-yellow-400/10 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-1">{getConditionIcon(condition.condition_type)}</div>
                    <span className="text-yellow-100 text-xs truncate">{formatConditionDetails(condition, timezone)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

