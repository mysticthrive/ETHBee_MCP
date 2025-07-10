import { supabaseAdmin } from "@/lib/supabase/client"
import type {
  BookingOrder,
  BookingOrderResponse,
  BookingOrderListResponse,
  CreateBookingOrderRequest,
  ConditionEvaluationResult,
  PriceCondition,
  TimeCondition,
  MarketCondition,
  TokenPriceData,
} from "@/lib/types/booking-order-types"
import { logError } from "@/lib/utils/error-utils"
import { getUserPrivateKey } from "@/lib/services/wallet-generation-service"

/**
 * Gets user wallet address from user_id
 */
async function getUserWallet(userId: string): Promise<string | null> {
  try {
    if (!supabaseAdmin) return null

    const { data, error } = await supabaseAdmin.from("users").select("wallet_address").eq("id", userId).single()

    if (error || !data) {
      console.error("Error fetching user wallet:", error)
      return null
    }

    return data.wallet_address
  } catch (error) {
    console.error("Error in getUserWallet:", error)
    return null
  }
}

/**
 * Creates a new booking order with complex conditions
 */
export async function createBookingOrder(request: CreateBookingOrderRequest): Promise<BookingOrderResponse> {
  try {
    console.log("Creating booking order:", request)

    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Supabase admin client is not initialized. Check your environment variables.",
      }
    }

    // Validate required fields
    if (
      !request.user_id ||
      !request.token_address ||
      !request.token_symbol ||
      !request.action_type ||
      !request.conditions ||
      request.conditions.length === 0
    ) {
      return {
        success: false,
        error: "Missing required fields for booking order",
      }
    }

    // Get user wallet address for reference
    const userKeypair = await getUserPrivateKey(request.user_id)
    if (!userKeypair) {
      return {
        success: false,
        error: "User wallet not found",
      }
    }

    // Set default logic type
    const logic_type = request.logic_type || "AND"

    // Calculate expiration time if not provided (default: 30 days)
    const expires_at = request.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const orderData: Omit<BookingOrder, "id" | "created_at" | "updated_at"> = {
      user_id: request.user_id,
      user_wallet: userKeypair.publicKey.toString(),
      token_address: request.token_address,
      token_symbol: request.token_symbol,
      action_type: request.action_type,
      amount: request.amount ? Number.parseFloat(request.amount) : undefined,
      conditions: request.conditions,
      logic_type,
      status: "pending",
      expires_at,
      last_checked_at: new Date().toISOString(),
      check_count: 0,
    }

    const { data, error } = await supabaseAdmin.from("booking_orders").insert(orderData).select().single()

    if (error) {
      logError(error, "createBookingOrder", { request })
      return {
        success: false,
        error: `Failed to create booking order: ${error.message}`,
      }
    }

    return {
      success: true,
      data,
      message: `Booking order created successfully with ${request.conditions.length} condition(s)`,
    }
  } catch (error) {
    logError(error, "createBookingOrder", { request })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error creating booking order",
    }
  }
}

/**
 * Gets all booking orders for a user by user_id
 */
export async function getUserBookingOrders(userId: string, status?: string): Promise<BookingOrderListResponse> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Supabase admin client is not initialized",
      }
    }

    let query = supabaseAdmin
      .from("booking_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      logError(error, "getUserBookingOrders", { userId, status })
      return {
        success: false,
        error: `Failed to fetch booking orders: ${error.message}`,
      }
    }

    return {
      success: true,
      data: (data || []) as BookingOrder[],
    }
  } catch (error) {
    logError(error, "getUserBookingOrders", { userId, status })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error fetching booking orders",
    }
  }
}

/**
 * Cancels a booking order by user_id
 */
export async function cancelBookingOrder(orderId: string, userId: string): Promise<BookingOrderResponse> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Supabase admin client is not initialized",
      }
    }

    const { data, error } = await supabaseAdmin
      .from("booking_orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .select()
      .single()

    if (error) {
      logError(error, "cancelBookingOrder", { orderId, userId })
      return {
        success: false,
        error: `Failed to cancel booking order: ${error.message}`,
      }
    }

    if (!data) {
      return {
        success: false,
        error: "Booking order not found or already processed",
      }
    }

    return {
      success: true,
      data,
      message: "Booking order cancelled successfully",
    }
  } catch (error) {
    logError(error, "cancelBookingOrder", { orderId, userId })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error cancelling booking order",
    }
  }
}

/**
 * Gets all pending booking orders for monitoring
 */
export async function getPendingBookingOrders(): Promise<BookingOrder[]> {
  try {
    if (!supabaseAdmin) {
      console.error("Supabase admin client is not initialized")
      return []
    }

    const { data, error } = await supabaseAdmin
      .from("booking_orders")
      .select("*")
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString()) // Get orders that have NOT expired yet
      .order("last_checked_at", { ascending: true })

    if (error) {
      logError(error, "getPendingBookingOrders")
      return []
    }

    return data as BookingOrder[]
  } catch (error) {
    logError(error, "getPendingBookingOrders")
    return []
  }
}

/**
 * Gets expired booking orders that need to be marked as expired
 */
export async function getExpiredBookingOrders(): Promise<BookingOrder[]> {
  try {
    if (!supabaseAdmin) {
      console.error("Supabase admin client is not initialized")
      return []
    }

    const { data, error } = await supabaseAdmin
      .from("booking_orders")
      .select("*")
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString()) // Get orders that HAVE expired
      .order("expires_at", { ascending: true })

    if (error) {
      logError(error, "getExpiredBookingOrders")
      return []
    }

    return data as BookingOrder[]
  } catch (error) {
    logError(error, "getExpiredBookingOrders")
    return []
  }
}

/**
 * Marks expired orders as expired
 */
export async function markOrderAsExpired(orderId: string): Promise<BookingOrderResponse> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Supabase admin client is not initialized",
      }
    }

    const { data, error } = await supabaseAdmin
      .from("booking_orders")
      .update({
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("status", "pending") // Only update if still pending
      .select()
      .single()

    if (error) {
      logError(error, "markOrderAsExpired", { orderId })
      return {
        success: false,
        error: `Failed to mark order as expired: ${error.message}`,
      }
    }

    return {
      success: true,
      data,
      message: "Order marked as expired successfully",
    }
  } catch (error) {
    logError(error, "markOrderAsExpired", { orderId })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error marking order as expired",
    }
  }
}

/**
 * Updates the last checked timestamp for an order
 */
export async function updateOrderCheckStatus(orderId: string): Promise<void> {
  try {
    if (!supabaseAdmin) return

    // First get the current check_count
    const { data: currentOrder } = await supabaseAdmin
      .from("booking_orders")
      .select("check_count")
      .eq("id", orderId)
      .single()

    const newCheckCount = (currentOrder?.check_count || 0) + 1

    await supabaseAdmin
      .from("booking_orders")
      .update({
        last_checked_at: new Date().toISOString(),
        check_count: newCheckCount,
      })
      .eq("id", orderId)
  } catch (error) {
    logError(error, "updateOrderCheckStatus", { orderId })
  }
}

/**
 * Marks an order as executed
 */
export async function markOrderAsExecuted(
  orderId: string,
  executionPrice: number,
  txHash?: string,
  executionDetails?: Record<string, any>,
): Promise<BookingOrderResponse> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Supabase admin client is not initialized",
      }
    }

    const { data, error } = await supabaseAdmin
      .from("booking_orders")
      .update({
        status: "executed",
        executed_at: new Date().toISOString(),
        execution_price: executionPrice,
        tx_hash: txHash,
        execution_details: executionDetails,
      })
      .eq("id", orderId)
      .select()
      .single()

    if (error) {
      logError(error, "markOrderAsExecuted", { orderId, executionPrice, txHash })
      return {
        success: false,
        error: `Failed to mark order as executed: ${error.message}`,
      }
    }

    return {
      success: true,
      data,
      message: "Order marked as executed successfully",
    }
  } catch (error) {
    logError(error, "markOrderAsExecuted", { orderId, executionPrice, txHash })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error marking order as executed",
    }
  }
}

/**
 * Evaluates a price condition against current market data
 */
export async function evaluatePriceCondition(
  condition: PriceCondition,
  tokenData: TokenPriceData,
): Promise<ConditionEvaluationResult> {
  const currentPrice = tokenData.price_usd

  let met = false
  let details = ""

  switch (condition.trigger_type) {
    case "above":
      met = currentPrice > condition.price
      details = `Current price $${currentPrice.toFixed(4)} ${met ? ">" : "≤"} target $${condition.price.toFixed(4)}`
      break

    case "below":
      met = currentPrice < condition.price
      details = `Current price $${currentPrice.toFixed(4)} ${met ? "<" : "≥"} target $${condition.price.toFixed(4)}`
      break

    case "between":
      if (condition.upper_price) {
        met = currentPrice >= condition.price && currentPrice <= condition.upper_price
        details = `Current price $${currentPrice.toFixed(4)} ${met ? "within" : "outside"} range $${condition.price.toFixed(4)} - $${condition.upper_price.toFixed(4)}`
      } else {
        met = false
        details = "Invalid between condition: missing upper_price"
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
 * Evaluates a time condition
 */
export function evaluateTimeCondition(condition: TimeCondition): ConditionEvaluationResult {
  const now = new Date()
  let met = false
  let details = ""

  if (condition.start_time && condition.end_time) {
    const startTime = new Date(condition.start_time)
    const endTime = new Date(condition.end_time)
    met = now >= startTime && now <= endTime
    details = `Current time ${now.toISOString()} ${met ? "within" : "outside"} window ${condition.start_time} - ${condition.end_time}`
  } else if (condition.start_time) {
    const startTime = new Date(condition.start_time)
    met = now >= startTime
    details = `Current time ${now.toISOString()} ${met ? "≥" : "<"} start time ${condition.start_time}`
  } else if (condition.end_time) {
    const endTime = new Date(condition.end_time)
    met = now <= endTime
    details = `Current time ${now.toISOString()} ${met ? "≤" : ">"} end time ${condition.end_time}`
  } else {
    met = true // No time constraints
    details = "No time constraints specified"
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
 * Evaluates a market condition
 */
export async function evaluateMarketCondition(
  condition: MarketCondition,
  tokenData: TokenPriceData,
): Promise<ConditionEvaluationResult> {
  let met = false
  let details = ""
  let currentValue: number | undefined

  if (condition.volume_trigger && condition.volume_threshold && tokenData.volume_24h) {
    currentValue = tokenData.volume_24h
    met = currentValue >= condition.volume_threshold
    details = `24h volume $${currentValue.toLocaleString()} ${met ? "≥" : "<"} threshold $${condition.volume_threshold.toLocaleString()}`
  } else if (condition.metric && condition.value && condition.comparison) {
    switch (condition.metric) {
      case "volume":
        currentValue = tokenData.volume_24h || 0
        break
      case "market_cap":
        currentValue = tokenData.market_cap || 0
        break
      default:
        currentValue = 0
    }

    switch (condition.comparison) {
      case "above":
        met = currentValue > condition.value
        break
      case "below":
        met = currentValue < condition.value
        break
      case "equals":
        met = Math.abs(currentValue - condition.value) < condition.value * 0.01 // 1% tolerance
        break
    }

    details = `${condition.metric} ${currentValue.toLocaleString()} ${condition.comparison} ${condition.value.toLocaleString()} = ${met}`
  } else {
    details = "Invalid market condition configuration"
  }

  return {
    condition_type: "market",
    met,
    current_value: currentValue,
    target_value: condition.volume_threshold || condition.value,
    details,
  }
}
