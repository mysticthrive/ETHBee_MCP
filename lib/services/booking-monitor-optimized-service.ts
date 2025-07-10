import { EventEmitter } from "events"
import { supabaseAdmin } from "@/lib/supabase/client"
import { realTimePriceService, type TokenPriceData } from "./real-time-price-service"
import type {
  BookingOrder,
  ConditionEvaluationResult,
  OrderEvaluationResult,
  PriceCondition,
  TimeCondition,
  MarketCondition,
} from "@/lib/types/booking-order-types"
import { logError } from "@/lib/utils/error-utils"

interface OptimizedOrderGroup {
  token_address: string
  token_symbol: string
  orders: BookingOrder[]
  lastPrice?: number
  lastChecked: number
}

interface ConditionIndex {
  priceAbove: Map<string, { threshold: number; orders: BookingOrder[] }>
  priceBelow: Map<string, { threshold: number; orders: BookingOrder[] }>
  priceBetween: Map<string, { lower: number; upper: number; orders: BookingOrder[] }>
  timeConditions: Map<string, { time: number; orders: BookingOrder[] }>
  volumeConditions: Map<string, { threshold: number; orders: BookingOrder[] }>
}

export class OptimizedBookingMonitorService extends EventEmitter {
  private orderGroups: Map<string, OptimizedOrderGroup> = new Map()
  private conditionIndex: ConditionIndex
  private monitoringInterval: NodeJS.Timeout | null = null
  private isRunning = false
  private checkInterval = 5000 // 5 seconds
  private priceUpdateBuffer: Map<string, TokenPriceData> = new Map()
  private lastOptimization = 0
  private optimizationInterval = 60000 // 1 minute

  constructor() {
    super()
    this.conditionIndex = {
      priceAbove: new Map(),
      priceBelow: new Map(),
      priceBetween: new Map(),
      timeConditions: new Map(),
      volumeConditions: new Map(),
    }
    this.setupPriceSubscriptions()
  }

  /**
   * Start the monitoring service
   */
  async start(): Promise<void> {
    if (this.isRunning) return

    console.log("🚀 Starting optimized booking monitor service...")
    this.isRunning = true

    // Load all pending orders
    await this.loadPendingOrders()

    // Start monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.processOrderChecks()
    }, this.checkInterval)

    // Start optimization routine
    setInterval(() => {
      this.optimizeConditionIndex()
    }, this.optimizationInterval)

    // Start expired order cleanup routine (every 10 minutes)
    setInterval(() => {
      this.cleanupExpiredOrders()
    }, 10 * 60 * 1000)

    this.emit("serviceStarted")
  }

  /**
   * Stop the monitoring service
   */
  stop(): void {
    if (!this.isRunning) return

    console.log("🛑 Stopping booking monitor service...")
    this.isRunning = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Unsubscribe from all price feeds
    for (const group of this.orderGroups.values()) {
      realTimePriceService.unsubscribeFromToken(group.token_symbol)
    }

    this.orderGroups.clear()
    this.clearConditionIndex()
    this.emit("serviceStopped")
  }

  /**
   * Add a new booking order to monitoring
   */
  async addOrder(order: BookingOrder): Promise<void> {
    const groupKey = `${order.token_address}_${order.token_symbol}`

    let group = this.orderGroups.get(groupKey)
    if (!group) {
      group = {
        token_address: order.token_address,
        token_symbol: order.token_symbol,
        orders: [],
        lastChecked: 0,
      }
      this.orderGroups.set(groupKey, group)

      // Subscribe to price updates for this token
      await realTimePriceService.subscribeToToken(order.token_symbol, order.token_address)
    }

    group.orders.push(order)
    this.indexOrderConditions(order)

    console.log(`📝 Added booking order ${order.id} for ${order.token_symbol}`)
    this.emit("orderAdded", order)
  }

  /**
   * Remove an order from monitoring
   */
  removeOrder(orderId: string): void {
    for (const [groupKey, group] of this.orderGroups.entries()) {
      const orderIndex = group.orders.findIndex((o) => o.id === orderId)
      if (orderIndex !== -1) {
        const order = group.orders[orderIndex]
        group.orders.splice(orderIndex, 1)
        this.removeOrderFromIndex(order)

        // If no more orders for this token, unsubscribe
        if (group.orders.length === 0) {
          realTimePriceService.unsubscribeFromToken(group.token_symbol)
          this.orderGroups.delete(groupKey)
        }

        console.log(`🗑️ Removed booking order ${orderId}`)
        this.emit("orderRemoved", orderId)
        break
      }
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    const totalOrders = Array.from(this.orderGroups.values()).reduce((sum, group) => sum + group.orders.length, 0)

    return {
      isRunning: this.isRunning,
      totalOrders,
      activeTokens: this.orderGroups.size,
      lastOptimization: this.lastOptimization,
      indexSizes: {
        priceAbove: this.conditionIndex.priceAbove.size,
        priceBelow: this.conditionIndex.priceBelow.size,
        priceBetween: this.conditionIndex.priceBetween.size,
        timeConditions: this.conditionIndex.timeConditions.size,
        volumeConditions: this.conditionIndex.volumeConditions.size,
      },
    }
  }

  /**
   * Setup price update subscriptions
   */
  private setupPriceSubscriptions(): void {
    realTimePriceService.on("priceUpdate", (priceData: TokenPriceData) => {
      this.handlePriceUpdate(priceData)
    })
  }

  /**
   * Handle real-time price updates
   */
  private handlePriceUpdate(priceData: TokenPriceData): void {
    console.log("🟢", priceData);
    // Buffer price updates to avoid excessive processing
    this.priceUpdateBuffer.set(priceData.symbol, priceData)

    // Find relevant order group
    const groupKey = `${priceData.address}_${priceData.symbol}`
    const group = this.orderGroups.get(groupKey)

    if (group) {
      group.lastPrice = priceData.price

      // Emit price update for UI
      this.emit("priceUpdate", {
        token_symbol: priceData.symbol,
        token_address: priceData.address,
        price: priceData.price,
        change_24h: priceData.priceChange24h,
        volume_24h: priceData.volume24h,
        timestamp: priceData.timestamp,
      })

      // Check price-based conditions immediately for this token
      this.checkPriceConditionsForToken(priceData)
    }
  }

  /**
   * Clean up expired orders
   */
  private async cleanupExpiredOrders(): Promise<void> {
    try {
      if (!supabaseAdmin) {
        console.error("Supabase admin client not initialized")
        return
      }

      // Get expired orders
      const { data: expiredOrders, error } = await supabaseAdmin
        .from("booking_orders")
        .select("*")
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString()) // Get orders that HAVE expired

      if (error) {
        logError(error, "cleanupExpiredOrders")
        return
      }

      if (expiredOrders && expiredOrders.length > 0) {
        console.log(`🧹 Cleaning up ${expiredOrders.length} expired booking orders...`)

        // Mark each expired order as expired
        for (const order of expiredOrders) {
          await supabaseAdmin
            .from("booking_orders")
            .update({
              status: "expired",
              updated_at: new Date().toISOString()
            })
            .eq("id", order.id)

          // Remove from monitoring
          this.removeOrder(order.id)
        }

        console.log(`✅ Cleaned up ${expiredOrders.length} expired orders`)
      }
    } catch (error) {
      logError(error, "cleanupExpiredOrders")
    }
  }

  /**
   * Load all pending orders from database
   */
  private async loadPendingOrders(): Promise<void> {
    try {
      if (!supabaseAdmin) {
        console.error("Supabase admin client not initialized")
        return
      }

      const { data: orders, error } = await supabaseAdmin
        .from("booking_orders")
        .select("*")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString()) // Get orders that have NOT expired yet

      if (error) {
        logError(error, "loadPendingOrders")
        return
      }

      console.log(`📚 Loading ${orders?.length || 0} pending booking orders...`)

      for (const order of orders || []) {
        await this.addOrder(order as BookingOrder)
      }

      console.log(`✅ Loaded ${orders?.length || 0} pending orders for monitoring`)
    } catch (error) {
      logError(error, "loadPendingOrders")
    }
  }

  /**
   * Index order conditions for optimized lookup
   */
  private indexOrderConditions(order: BookingOrder): void {
    for (const condition of order.conditions) {
      switch (condition.condition_type) {
        case "price":
          this.indexPriceCondition(order, condition.condition_details as PriceCondition)
          break
        case "time":
          this.indexTimeCondition(order, condition.condition_details as TimeCondition)
          break
        case "market":
          this.indexMarketCondition(order, condition.condition_details as MarketCondition)
          break
      }
    }
  }

  /**
   * Index price conditions for fast lookup
   */
  private indexPriceCondition(order: BookingOrder, condition: PriceCondition): void {
    const key = `${order.token_address}_${order.token_symbol}`

    switch (condition.trigger_type) {
      case "above":
        let aboveGroup = this.conditionIndex.priceAbove.get(key)
        if (!aboveGroup) {
          aboveGroup = { threshold: condition.price, orders: [] }
          this.conditionIndex.priceAbove.set(key, aboveGroup)
        }
        aboveGroup.orders.push(order)
        break

      case "below":
        let belowGroup = this.conditionIndex.priceBelow.get(key)
        if (!belowGroup) {
          belowGroup = { threshold: condition.price, orders: [] }
          this.conditionIndex.priceBelow.set(key, belowGroup)
        }
        belowGroup.orders.push(order)
        break

      case "between":
        if (condition.upper_price) {
          let betweenGroup = this.conditionIndex.priceBetween.get(key)
          if (!betweenGroup) {
            betweenGroup = {
              lower: condition.price,
              upper: condition.upper_price,
              orders: [],
            }
            this.conditionIndex.priceBetween.set(key, betweenGroup)
          }
          betweenGroup.orders.push(order)
        }
        break
    }
  }

  /**
   * Index time conditions
   */
  private indexTimeCondition(order: BookingOrder, condition: TimeCondition): void {
    const key = `time_${order.id}`
    const targetTime = condition.start_time ? new Date(condition.start_time).getTime() : Date.now()

    this.conditionIndex.timeConditions.set(key, {
      time: targetTime,
      orders: [order],
    })
  }

  /**
   * Index market conditions
   */
  private indexMarketCondition(order: BookingOrder, condition: MarketCondition): void {
    if (condition.volume_trigger && condition.volume_threshold) {
      const key = `${order.token_address}_volume`
      let volumeGroup = this.conditionIndex.volumeConditions.get(key)
      if (!volumeGroup) {
        volumeGroup = { threshold: condition.volume_threshold, orders: [] }
        this.conditionIndex.volumeConditions.set(key, volumeGroup)
      }
      volumeGroup.orders.push(order)
    }
  }

  /**
   * Remove order from condition index
   */
  private removeOrderFromIndex(order: BookingOrder): void {
    const key = `${order.token_address}_${order.token_symbol}`

    // Remove from price indexes
    this.removeOrderFromPriceIndex(this.conditionIndex.priceAbove.get(key), order)
    this.removeOrderFromPriceIndex(this.conditionIndex.priceBelow.get(key), order)
    this.removeOrderFromPriceIndex(this.conditionIndex.priceBetween.get(key), order)

    // Remove from time index
    this.conditionIndex.timeConditions.delete(`time_${order.id}`)

    // Remove from volume index
    const volumeKey = `${order.token_address}_volume`
    this.removeOrderFromPriceIndex(this.conditionIndex.volumeConditions.get(volumeKey), order)
  }

  /**
   * Helper to remove order from price index group
   */
  private removeOrderFromPriceIndex(group: any, order: BookingOrder): void {
    if (group) {
      const index = group.orders.findIndex((o: BookingOrder) => o.id === order.id)
      if (index !== -1) {
        group.orders.splice(index, 1)
      }
    }
  }

  /**
   * Check price conditions for a specific token
   */
  private checkPriceConditionsForToken(priceData: TokenPriceData): void {
    const key = `${priceData.address}_${priceData.symbol}`
    const currentPrice = priceData.price

    // Check price above conditions
    const aboveGroup = this.conditionIndex.priceAbove.get(key)
    if (aboveGroup && currentPrice >= aboveGroup.threshold) {
      this.evaluateOrdersInGroup(aboveGroup.orders, priceData)
    }

    // Check price below conditions
    const belowGroup = this.conditionIndex.priceBelow.get(key)
    if (belowGroup && currentPrice <= belowGroup.threshold) {
      this.evaluateOrdersInGroup(belowGroup.orders, priceData)
    }

    // Check price between conditions
    const betweenGroup = this.conditionIndex.priceBetween.get(key)
    if (betweenGroup && currentPrice >= betweenGroup.lower && currentPrice <= betweenGroup.upper) {
      this.evaluateOrdersInGroup(betweenGroup.orders, priceData)
    }

    // Check volume conditions
    const volumeKey = `${priceData.address}_volume`
    const volumeGroup = this.conditionIndex.volumeConditions.get(volumeKey)
    if (volumeGroup && priceData.volume24h && priceData.volume24h >= volumeGroup.threshold) {
      this.evaluateOrdersInGroup(volumeGroup.orders, priceData)
    }
  }

  /**
   * Evaluate a group of orders
   */
  private async evaluateOrdersInGroup(orders: BookingOrder[], priceData: TokenPriceData): Promise<void> {
    for (const order of orders) {
      if (order.status !== "pending") continue

      const evaluation = await this.evaluateOrder(order, priceData)
      if (evaluation.should_execute) {
        await this.executeOrder(order, evaluation)
      }
    }
  }

  /**
   * Process all order checks (time-based and buffered price updates)
   */
  private async processOrderChecks(): Promise<void> {
    if (!this.isRunning) return

    const now = Date.now()

    // Process time-based conditions
    for (const [, timeGroup] of this.conditionIndex.timeConditions.entries()) {
      if (now >= timeGroup.time) {
        for (const order of timeGroup.orders) {
          if (order.status === "pending") {
            const evaluation = await this.evaluateOrder(order)
            if (evaluation.should_execute) {
              await this.executeOrder(order, evaluation)
            }
          }
        }
      }
    }

    // Process buffered price updates
    // Price updates are already processed in handlePriceUpdate
    // This buffer is cleared to prevent memory leaks

    // Clear the buffer
    this.priceUpdateBuffer.clear()
  }

  /**
   * Evaluate if an order should be executed
   */
  private async evaluateOrder(order: BookingOrder, priceData?: TokenPriceData): Promise<OrderEvaluationResult> {
    const conditionResults: ConditionEvaluationResult[] = []
    let currentTokenPrice = priceData?.price

    // Get current price if not provided
    if (!currentTokenPrice) {
      const cachedPrice = realTimePriceService.getCurrentPrice(order.token_symbol)
      currentTokenPrice = cachedPrice?.price
    }

    // Evaluate each condition
    for (const condition of order.conditions) {
      let result: ConditionEvaluationResult

      switch (condition.condition_type) {
        case "price":
          result = await this.evaluatePriceCondition(
            condition.condition_details as PriceCondition,
            currentTokenPrice || 0,
          )
          break
        case "time":
          result = this.evaluateTimeCondition(condition.condition_details as TimeCondition)
          break
        case "market":
          result = await this.evaluateMarketCondition(condition.condition_details as MarketCondition, priceData)
          break
        default:
          result = {
            condition_type: condition.condition_type,
            met: false,
            details: "Unknown condition type",
          }
      }

      conditionResults.push(result)
    }

    // Apply logic (AND/OR)
    const logicResult =
      order.logic_type === "OR" ? conditionResults.some((r) => r.met) : conditionResults.every((r) => r.met)

    return {
      order_id: order.id!,
      should_execute: logicResult,
      conditions_met: conditionResults,
      logic_result: logicResult,
      current_token_price: currentTokenPrice,
      evaluation_time: new Date().toISOString(),
    }
  }

  /**
   * Evaluate price condition
   */
  private async evaluatePriceCondition(
    condition: PriceCondition,
    currentPrice: number,
  ): Promise<ConditionEvaluationResult> {
    let met = false
    let details = ""

    switch (condition.trigger_type) {
      case "above":
        met = currentPrice > condition.price
        details = `Price $${currentPrice} ${met ? ">" : "≤"} target $${condition.price}`
        break
      case "below":
        met = currentPrice < condition.price
        details = `Price $${currentPrice} ${met ? "<" : "≥"} target $${condition.price}`
        break
      case "between":
        if (condition.upper_price) {
          met = currentPrice >= condition.price && currentPrice <= condition.upper_price
          details = `Price $${currentPrice} ${met ? "within" : "outside"} range $${condition.price}-$${condition.upper_price}`
        }
        break
    }

    return {
      condition_type: "price",
      met,
      current_value: currentPrice,
      target_value: condition.price,
      details,
    }
  }

  /**
   * Evaluate time condition
   */
  private evaluateTimeCondition(condition: TimeCondition): ConditionEvaluationResult {
    const now = new Date()
    let met = false
    let details = ""

    if (condition.start_time && condition.end_time) {
      const startTime = new Date(condition.start_time)
      const endTime = new Date(condition.end_time)
      met = now >= startTime && now <= endTime
      details = `Time ${now.toISOString()} ${met ? "within" : "outside"} window`
    } else if (condition.start_time) {
      const startTime = new Date(condition.start_time)
      met = now >= startTime
      details = `Time ${now.toISOString()} ${met ? "≥" : "<"} start time`
    } else {
      met = true
      details = "No time constraints"
    }

    return {
      condition_type: "time",
      met,
      current_value: now.toISOString(),
      target_value: condition.start_time || condition.end_time,
      details,
    }
  }

  /**
   * Evaluate market condition
   */
  private async evaluateMarketCondition(
    condition: MarketCondition,
    priceData?: TokenPriceData,
  ): Promise<ConditionEvaluationResult> {
    let met = false
    let details = ""
    let currentValue: number | undefined

    if (condition.volume_trigger && condition.volume_threshold && priceData?.volume24h) {
      currentValue = priceData.volume24h
      met = currentValue >= condition.volume_threshold
      details = `Volume $${currentValue.toLocaleString()} ${met ? "≥" : "<"} threshold $${condition.volume_threshold.toLocaleString()}`
    }

    return {
      condition_type: "market",
      met,
      current_value: currentValue,
      target_value: condition.volume_threshold,
      details,
    }
  }

  /**
   * Execute an order when conditions are met
   */
  private async executeOrder(order: BookingOrder, evaluation: OrderEvaluationResult): Promise<void> {
    try {
      console.log(`🎯 Executing booking order ${order.id} for ${order.token_symbol}`)

      // Update order status to executing
      await this.updateOrderStatus(order.id!, "executing")

      let executionResult

      if (order.action_type === "notify_booking") {
        // For notification orders, just mark as executed
        executionResult = {
          success: true,
          message: `Notification triggered for ${order.token_symbol}`,
          tx_hash: null,
        }
      } else {
        // Execute the actual trade
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        const endpoint = order.action_type === "buy_booking" ? "/api/trade/buy" : "/api/trade/sell"
        const fullUrl = `${baseUrl}${endpoint}`

        executionResult = await fetch(fullUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_wallet: order.user_wallet,
            token_address: order.token_address,
            token_symbol: order.token_symbol,
            amount: order.amount?.toString(),
            price_type: "market",
          }),
        }).then((res) => res.json())
      }

      if (executionResult.success) {
        // Mark order as executed
        await this.markOrderAsExecuted(order.id!, evaluation.current_token_price || 0, executionResult.tx_hash, {
          evaluation,
          execution_result: executionResult,
        })

        // Remove from monitoring
        this.removeOrder(order.id!)

        // Emit execution event
        this.emit("orderExecuted", {
          order,
          evaluation,
          execution_result: executionResult,
        })

        console.log(`✅ Successfully executed booking order ${order.id}`)
      } else {
        // Mark as failed
        await this.updateOrderStatus(order.id!, "failed")
        console.error(`❌ Failed to execute booking order ${order.id}:`, executionResult.error)
      }
    } catch (error) {
      logError(error, "executeOrder", { orderId: order.id })
      await this.updateOrderStatus(order.id!, "failed")
    }
  }

  /**
   * Update order status in database
   */
  private async updateOrderStatus(orderId: string, status: string): Promise<void> {
    if (!supabaseAdmin) return

    await supabaseAdmin
      .from("booking_orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
  }

  /**
   * Mark order as executed in database
   */
  private async markOrderAsExecuted(
    orderId: string,
    executionPrice: number,
    txHash?: string,
    executionDetails?: Record<string, any>,
  ): Promise<void> {
    if (!supabaseAdmin) return

    await supabaseAdmin
      .from("booking_orders")
      .update({
        status: "executed",
        executed_at: new Date().toISOString(),
        execution_price: executionPrice,
        tx_hash: txHash,
        execution_details: executionDetails,
      })
      .eq("id", orderId)
  }

  /**
   * Optimize condition index by removing empty groups
   */
  private optimizeConditionIndex(): void {
    const now = Date.now()

    // Remove empty groups from indexes
    for (const [key, group] of this.conditionIndex.priceAbove.entries()) {
      if (group.orders.length === 0) {
        this.conditionIndex.priceAbove.delete(key)
      }
    }

    for (const [key, group] of this.conditionIndex.priceBelow.entries()) {
      if (group.orders.length === 0) {
        this.conditionIndex.priceBelow.delete(key)
      }
    }

    for (const [key, group] of this.conditionIndex.priceBetween.entries()) {
      if (group.orders.length === 0) {
        this.conditionIndex.priceBetween.delete(key)
      }
    }

    for (const [key, group] of this.conditionIndex.volumeConditions.entries()) {
      if (group.orders.length === 0) {
        this.conditionIndex.volumeConditions.delete(key)
      }
    }

    this.lastOptimization = now
    console.log("🔧 Optimized condition indexes")
  }

  /**
   * Clear all condition indexes
   */
  private clearConditionIndex(): void {
    this.conditionIndex.priceAbove.clear()
    this.conditionIndex.priceBelow.clear()
    this.conditionIndex.priceBetween.clear()
    this.conditionIndex.timeConditions.clear()
    this.conditionIndex.volumeConditions.clear()
  }
}

// Singleton instance
export const optimizedBookingMonitor = new OptimizedBookingMonitorService()
