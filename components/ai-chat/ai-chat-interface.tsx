"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Zap,
  TrendingUp,
  Star,
  MessageSquare,
  ChevronDown,
  Copy,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BeeIcon } from "@/components/shared/bee-icon"
import { Clock, Volume2, Target, CheckCircle } from "lucide-react"
import { BookingOrdersView } from "./booking-orders-view"
import { realTimePriceService, type TokenPriceData } from "@/lib/services/real-time-price-service"
import { useIsAuthenticated, useUser } from "@/store/hooks"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getUserTimezone, formatTimeInTimezone } from "@/lib/utils/timezone-utils"

// Simple function to generate unique IDs
const generateUniqueId = () => {
  return `id-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

type MessageType = {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  executedAction?: {
    type: string
    asset?: string
    amount?: number
    success: boolean
    txHash?: string
    price?: number
    priceType?: "market" | "limit"
    limitPrice?: number
    targetPrice?: number
    direction?: "above" | "below"
    conditions?: any[]
    logic_type?: string
    order_id?: string
  }
  booking_order?: BookingOrderType
}

type TokenType = {
  id: string
  symbol: string
  name: string
  price?: number
  priceChange?: number
}

type BookingOrderType = {
  id: string
  token_symbol: string
  token_address: string
  action_type: string
  amount?: number
  conditions: Array<{
    condition_type: string
    condition_details: any
  }>
  logic_type: string
  status: string
  created_at: string
}

type RealTimeConditionStatus = {
  condition_type: string
  met: boolean
  current_value?: any
  target_value?: any
  details?: string
}

interface AIChatInterfaceProps {
  onTokenMention?: (token: TokenType) => void
}

export function AIChatInterface({ onTokenMention }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: "welcome-message",
      content:
        "🐝 Welcome to EthBee! I'm your intelligent trading assistant powered by advanced AI. I can help you execute trades, monitor markets, and manage your Solana portfolio with natural language commands. What would you like to do today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [realtimeConditions, setRealtimeConditions] = useState<Map<string, RealTimeConditionStatus[]>>(new Map())
  const [realtimePrices, setRealtimePrices] = useState<Map<string, { price: number; change_24h?: number }>>(new Map())
  const [showBookingOrders, setShowBookingOrders] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get authentication state
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const timezone = user?.timezone || getUserTimezone()

  // Suggested commands
  const suggestedCommands = [
    { text: "Buy 10 BONK", icon: <TrendingUp className="w-3 h-3" /> },
    { text: "Sell 10 BONK", icon: <TrendingUp className="w-3 h-3 rotate-180" /> },
    { text: "Check my balance", icon: <Eye className="w-3 h-3" /> },
    { text: "Set price alert", icon: <Bell className="w-3 h-3" /> },
  ]

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isAtBottom && messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messages, isAtBottom])

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setIsAtBottom(isNearBottom)
      setShowScrollToBottom(!isNearBottom && messages.length > 3)
    }
  }, [messages.length])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
      setIsAtBottom(true)
      setShowScrollToBottom(false)
    }
  }, [])

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Copy message to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log("Copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    // Add user message
    const userMessage: MessageType = {
      id: generateUniqueId(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)
    setShowSuggestions(false)

    try {
      // Convert messages for API
      const apiMessages = messages
        .filter((msg) => msg.id !== "welcome-message")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      apiMessages.push({ role: "user", content: input })

      const response = await fetch("/api/chat/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: apiMessages,
          userId: user?.id || undefined,
          currentTime: new Date().toISOString(),
          timezone: getUserTimezone()
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Add AI response
      const aiMessage: MessageType = {
        id: generateUniqueId(),
        content: data.response?.content || "I received your message but couldn't generate a proper response.",
        role: "assistant",
        timestamp: new Date(),
        executedAction: data.response?.executedAction,
        booking_order: data.response?.booking_order,
      }
      setMessages((prev) => [...prev, aiMessage])

      // Update token info if provided
      if (data.response?.token_info && onTokenMention) {
        const tokenInfo = {
          id: data.response.token_info.address || data.response.token_info.symbol,
          symbol: data.response.token_info.symbol,
          name: `${data.response.token_info.symbol} Token`,
          price: data.response.token_info.price,
          priceChange: data.response.token_info.priceChange,
        }
        onTokenMention(tokenInfo)
      }
    } catch (error) {
      console.error("Error calling AI API:", error)

      const errorMessage: MessageType = {
        id: generateUniqueId(),
        content:
          "I apologize, but I encountered an issue processing your request. This is a demo environment - in your local setup with proper API keys, all trading functions work seamlessly. Try commands like 'Buy 0.5 SOL' or 'Check my balance'.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      setTimeout(() => setShowSuggestions(true), 1000)
    }
  }

  // Booking Order Display Component
  const BookingOrderDisplay = ({ order }: { order: BookingOrderType; messageId: string }) => {
    const conditionStatuses = realtimeConditions.get(order.id) || []
    const priceData = realtimePrices.get(order.token_symbol)

    const getConditionIcon = (conditionType: string, met: boolean) => {
      if (met) return <CheckCircle className="w-3 h-3 text-emerald-400" />

      switch (conditionType) {
        case "price":
          return <TrendingUp className="w-3 h-3 text-amber-400" />
        case "time":
          return <Clock className="w-3 h-3 text-blue-400" />
        case "market":
          return <Volume2 className="w-3 h-3 text-purple-400" />
        default:
          return <Target className="w-3 h-3 text-gray-400" />
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case "pending":
          return "text-amber-400"
        case "executed":
          return "text-emerald-400"
        case "cancelled":
          return "text-red-400"
        case "expired":
          return "text-gray-400"
        default:
          return "text-gray-400"
      }
    }

    return (
      <motion.div
        className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 shadow-lg backdrop-blur-xl mt-4 p-4 border border-amber-500/30 rounded-xl"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="flex items-center font-semibold text-white text-sm">
              <Zap className="mr-2 w-4 h-4 text-amber-400" />
              {order.action_type.replace("_", " ").toUpperCase()} Order
            </h4>
            <p className="mt-1 text-gray-400 text-xs">
              {order.amount} {order.token_symbol} • ID: {order.id.substring(0, 8)}...
            </p>
          </div>
          <div className={`text-xs font-semibold px-2 py-1 rounded-full bg-opacity-20 ${getStatusColor(order.status)}`}>
            {order.status.toUpperCase()}
          </div>
        </div>

        {/* Current Price Display */}
        {priceData && (
          <div className="bg-black/30 mb-3 p-3 border border-amber-500/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-400 text-xs">Current Price:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-semibold text-white text-sm">${priceData.price}</span>
                {/* {priceData.change_24h && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${priceData.change_24h >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}
                  >
                    {priceData.change_24h >= 0 ? "+" : ""}
                    {priceData.change_24h.toFixed(2)}%
                  </span>
                )} */}
              </div>
            </div>
          </div>
        )}

        {/* Conditions */}
        <div className="space-y-3">
          <div className="flex items-center font-medium text-gray-300 text-xs">
            <Target className="mr-1 w-3 h-3" />
            Conditions ({order.logic_type}):
          </div>
          {order.conditions.map((condition, index) => {
            const status = conditionStatuses[index]
            return (
              <motion.div
                key={index}
                className="flex justify-between items-center bg-black/30 p-3 border border-gray-700/50 rounded-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-3">
                  {getConditionIcon(condition.condition_type, status?.met || false)}
                  <span className="font-medium text-gray-300 text-xs capitalize">{condition.condition_type}</span>
                </div>
                <div className="text-right">
                  {status ? (
                    <div>
                      <div className={`text-xs font-semibold ${status.met ? "text-emerald-400" : "text-gray-400"}`}>
                        {status.met ? "✓ MET" : "PENDING"}
                      </div>
                      {status.details && <div className="mt-1 text-gray-500 text-xs">{status.details}</div>}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xs">Monitoring conditions...</div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Progress Indicator */}
        {/* <div className="mt-4">
          <div className="flex justify-between mb-2 text-gray-400 text-xs">
            <span className="font-medium">Progress</span>
            <span>
              {conditionStatuses.filter((c) => c.met).length} / {order.conditions.length} conditions met
            </span>
          </div>
          <div className="bg-gray-700/50 rounded-full w-full h-2 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full h-2"
              initial={{ width: 0 }}
              animate={{
                width: `${(conditionStatuses.filter((c) => c.met).length / order.conditions.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div> */}
      </motion.div>
    )
  }

  // Setup real-time monitoring for booking orders
  useEffect(() => {
    const setupRealtimeMonitoring = () => {
      // Subscribe to price updates for all tokens in messages
      const subscribedTokens = new Set<string>()

      messages.forEach((message) => {
        if (message.booking_order) {
          const tokenSymbol = message.booking_order.token_symbol
          if (!subscribedTokens.has(tokenSymbol)) {
            subscribedTokens.add(tokenSymbol)
            realTimePriceService.subscribeToToken(tokenSymbol, message.booking_order.token_address)
          }
        }
      })

      // Listen for price updates
      const handlePriceUpdate = (priceData: TokenPriceData) => {
        setRealtimePrices(
          (prev) =>
            new Map(
              prev.set(priceData.symbol, {
                price: priceData.price,
                change_24h: priceData.priceChange24h || 0,
              }),
            ),
        )

        // Update condition statuses for affected orders
        messages.forEach((message) => {
          if (
            message.booking_order &&
            message.booking_order.status === "pending" &&
            message.booking_order.token_symbol === priceData.symbol
          ) {
            const order = message.booking_order
            const conditionStatuses: RealTimeConditionStatus[] = order.conditions.map((condition) => {
              if (condition.condition_type === "price") {
                const details = condition.condition_details
                let met = false
                let detailsText = ""

                switch (details.trigger_type) {
                  case "above":
                    met = priceData.price > details.price
                    detailsText = `$${priceData.price} ${met ? ">" : "≤"} $${details.price}`
                    break
                  case "below":
                    met = priceData.price < details.price
                    detailsText = `$${priceData.price} ${met ? "<" : "≥"} $${details.price}`
                    break
                  case "between":
                    met = priceData.price >= details.price && priceData.price <= details.upper_price
                    detailsText = `$${priceData.price} ${met ? "within" : "outside"} $${details.price}-$${details.upper_price}`
                    break
                }

                return {
                  condition_type: "price",
                  met,
                  current_value: priceData.price,
                  target_value: details.price,
                  details: detailsText,
                }
              } else if (condition.condition_type === "time") {
                const now = new Date()
                const startTime = condition.condition_details.start_time
                  ? new Date(condition.condition_details.start_time)
                  : null
                const met = !startTime || now >= startTime

                return {
                  condition_type: "time",
                  met,
                  current_value: now.toISOString(),
                  target_value: condition.condition_details.start_time,
                  details: met ? "Time condition met" : `Waiting until ${startTime?.toLocaleString()}`,
                }
              } else {
                return {
                  condition_type: condition.condition_type,
                  met: false,
                  details: "Monitoring conditions...",
                }
              }
            })

            setRealtimeConditions((prev) => new Map(prev.set(order.id, conditionStatuses)))
          }
        })
      }

      // Subscribe to price updates
      realTimePriceService.on("priceUpdate", handlePriceUpdate)

      // Cleanup function
      return () => {
        realTimePriceService.removeListener("priceUpdate", handlePriceUpdate)
        subscribedTokens.forEach((token) => {
          realTimePriceService.unsubscribeFromToken(token)
        })
      }
    }

    const cleanup = setupRealtimeMonitoring()
    return cleanup
  }, [messages])

  // Bell icon component
  function Bell(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    )
  }

  return (
    <div className="relative flex flex-col bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 shadow-2xl backdrop-blur-xl border border-amber-500/30 rounded-2xl w-full h-full overflow-hidden">
      {/* Header */}
      <div className="relative flex flex-shrink-0 justify-between items-center bg-gradient-to-r from-amber-500/10 to-yellow-500/10 p-4 border-amber-500/20 border-b">
        <div className="flex items-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 mr-3 p-2 border border-amber-500/30 rounded-full"
          >
            <BeeIcon className="w-6 h-6 text-amber-400" />
          </motion.div>
          <div>
            <h3 className="font-bold text-white text-lg">EthBee AI</h3>
            <p className="text-amber-200/70 text-xs">Intelligent Trading Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Debug: Show current timezone used for formatting */}
          <div className="px-1 py-1 border-yellow-400/10 text-yellow-300 text-xs">
            <strong>Timezone:</strong> {timezone}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowBookingOrders(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/50 hover:border-amber-400 w-32 h-9 text-amber-300 hover:text-amber-200 transition-all duration-200"
                  disabled={!isAuthenticated}
                >
                  <Eye className="w-4 h-4" />
                  View Orders
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Orders</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setMessages([messages[0]])}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/50 hover:border-amber-400 w-28 h-9 text-amber-300 hover:text-amber-200 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex flex-shrink-0 items-center bg-gradient-to-r from-amber-600/20 to-yellow-600/20 px-4 py-2 border-amber-500/30 border-b text-amber-200 text-xs">
        <AlertTriangle className="flex-shrink-0 mr-2 w-3 h-3 text-amber-400" />
        <span className="font-medium">Demo Mode: This is a preview version with simulated trading functionality.</span>
      </div>

      {/* Chat Messages Container */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={messagesContainerRef}
          className={`absolute inset-0 space-y-6 p-6 overflow-x-hidden overflow-y-auto transition-all duration-300 bg-black/10 ${showBookingOrders ? "right-96" : "right-0"
            }`}
          onScroll={handleScroll}
          style={{
            scrollBehavior: "smooth",
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(245 158 11 / 0.5) transparent",
          }}
        >
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${message.role === "user"
                    ? "bg-transparent border border-blue-500/30 backdrop-blur-xl text-white"
                    : "bg-transparent backdrop-blur-xl border border-amber-500/20 text-gray-100"
                    }`}
                >
                  <div className="flex items-start mb-2">
                    <motion.div
                      className={`rounded-full p-2 mr-3 ${message.role === "user"
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30"
                        }`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-amber-400" />
                      )}
                    </motion.div>
                    <div className="flex-1 leading-relaxed whitespace-pre-wrap">{message.content}</div>

                    {/* Message actions */}
                    <div className="opacity-0 group-hover:opacity-100 ml-2 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-white/10 rounded-full w-6 h-6 text-gray-400 hover:text-white"
                              onClick={() => copyToClipboard(message.content)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy message</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {message.executedAction && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-white/10 border-t"
                    >
                      <div className="bg-black/20 p-3 rounded-lg">
                        <div className="flex flex-wrap items-center mb-2 text-sm">
                          <Star className="mr-2 w-4 h-4 text-amber-400" />
                          <span className="mr-2 font-semibold">Action Executed:</span>
                          <span className="font-medium capitalize">
                            {message.executedAction.type.replace("_", " ")}
                          </span>

                          {message.executedAction.asset && (
                            <>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="font-mono">{message.executedAction.asset}</span>
                            </>
                          )}

                          {message.executedAction.amount && (
                            <>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="font-mono">{message.executedAction.amount}</span>
                            </>
                          )}
                        </div>

                        {message.executedAction.txHash && (
                          <div className="mb-2 text-gray-400 text-xs">
                            <span className="font-medium">Transaction: </span>
                            <span className="bg-black/30 px-2 py-1 rounded font-mono">
                              {message.executedAction.txHash.substring(0, 16)}...
                            </span>
                          </div>
                        )}

                        <div className="flex items-center text-sm">
                          <span className="mr-2 font-medium">Status:</span>
                          {message.executedAction.success ? (
                            <span className="flex items-center bg-emerald-400/10 px-2 py-1 rounded-full text-emerald-400">
                              <CheckCircle2 className="mr-1 w-3 h-3" /> Success (Demo)
                            </span>
                          ) : (
                            <span className="flex items-center bg-red-400/10 px-2 py-1 rounded-full text-red-400">
                              <AlertTriangle className="mr-1 w-3 h-3" /> Failed
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {message.booking_order && (
                    <BookingOrderDisplay order={message.booking_order} messageId={message.id} />
                  )}

                  <div className="opacity-60 mt-3 font-medium text-xs">
                    {formatTimeInTimezone(new Date(message.timestamp), timezone, { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Processing indicator */}
          {isProcessing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 shadow-lg backdrop-blur-xl p-4 border border-amber-500/20 rounded-2xl text-gray-200">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5 text-amber-400" />
                  </motion.div>
                  <span className="font-medium">Processing your request...</span>
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="bg-amber-400 rounded-full w-1 h-1"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToBottom}
            className="right-6 bottom-24 z-10 absolute bg-gradient-to-r from-amber-500 hover:from-amber-600 to-yellow-500 hover:to-yellow-600 shadow-xl p-3 rounded-full text-white hover:scale-110 transition-all duration-200 transform"
            title="Scroll to bottom"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Suggested commands */}
      {showSuggestions && messages.length < 3 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 pb-2">
          <div className="flex items-center mb-2">
            <MessageSquare className="mr-2 w-3 h-3 text-amber-400" />
            <span className="font-medium text-amber-200 text-xs">Suggested commands:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedCommands.map((command, index) => (
              <motion.button
                key={index}
                className="flex items-center bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 border border-amber-500/30 rounded-full text-amber-300 text-xs transition-all duration-200"
                onClick={() => handleSuggestionClick(command.text)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="mr-1.5">{command.icon}</span>
                {command.text}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Enhanced Input Form */}
      <motion.form
        onSubmit={handleSubmit}
        className={`flex-shrink-0 bg-gradient-to-r from-black/30 to-gray-900/30 backdrop-blur-xl p-4 border-amber-500/20 border-t transition-all duration-300 ${showBookingOrders ? "mr-96" : ""
          }`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask EthBee anything about trading, market data, or portfolio management..."
              className="bg-transparent backdrop-blur-xl px-6 py-4 border border-amber-500/30 focus:border-amber-500/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 w-full text-white text-sm transition-all duration-200 placeholder-gray-400"
              disabled={isProcessing}
            />
            <div className="top-1/2 right-4 absolute text-gray-500 -translate-y-1/2 transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="bg-gradient-to-r from-amber-500 hover:from-amber-600 to-yellow-500 hover:to-yellow-600 disabled:opacity-50 shadow-lg px-6 py-3 rounded-2xl h-12 font-semibold text-white disabled:transform-none hover:scale-105 transition-all duration-200 disabled:cursor-not-allowed transform"
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Loader2 className="w-5 h-5" />
              </motion.div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </motion.form>

      {/* Booking Orders View Sidebar */}
      <BookingOrdersView isOpen={showBookingOrders} onClose={() => setShowBookingOrders(false)} />
    </div>
  )
}
