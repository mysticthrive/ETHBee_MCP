// Types for booking orders with complex conditions

export interface PriceCondition {
  trigger_type: "below" | "above" | "between"
  price: number
  upper_price?: number // For 'between' trigger type
}

export interface TimeCondition {
  start_time?: string // ISO string
  end_time?: string // ISO string
  recurring?: boolean
  frequency?: "daily" | "weekly" | "monthly" | null
}

export interface MarketCondition {
  volume_trigger?: boolean
  volume_threshold?: number
  metric?: "volume" | "market_cap" | "liquidity"
  value?: number
  comparison?: "above" | "below" | "equals"
}

export interface BookingCondition {
  condition_type: "price" | "time" | "market"
  condition_details: PriceCondition | TimeCondition | MarketCondition
}

export interface BookingOrder {
  id?: string
  user_id: string // Changed from user_wallet to user_id
  user_wallet?: string // Keep for reference but not primary
  token_address: string
  token_symbol: string
  action_type: "buy_booking" | "sell_booking" | "notify_booking"
  amount?: number | string

  // Conditions
  conditions: BookingCondition[]
  logic_type: "AND" | "OR"

  // Status and execution
  status: "pending" | "executed" | "cancelled" | "expired"
  created_at?: string
  updated_at?: string
  executed_at?: string
  expires_at?: string

  // Execution details
  tx_hash?: string
  execution_price?: number
  execution_details?: Record<string, any>

  // Monitoring metadata
  last_checked_at?: string
  check_count?: number

  // Additional details
  details?: Record<string, any>
}

export interface BookingOrderResponse {
  success: boolean
  data?: BookingOrder
  error?: string
  message?: string
}

export interface BookingOrderListResponse {
  success: boolean
  data?: BookingOrder[]
  error?: string
  message?: string
}

export interface ConditionEvaluationResult {
  condition_type: string
  met: boolean
  current_value?: any
  target_value?: any
  details?: string
}

export interface OrderEvaluationResult {
  order_id: string
  should_execute: boolean
  conditions_met: ConditionEvaluationResult[]
  logic_result: boolean
  current_token_price?: number
  evaluation_time: string
  error?: string
}

// Request types for API
export interface CreateBookingOrderRequest {
  user_id: string // Changed from user_wallet to user_id
  action_type: "buy_booking" | "sell_booking" | "notify_booking"
  token_address: string
  token_symbol: string
  amount?: string

  conditions: BookingCondition[]
  logic_type?: "AND" | "OR"
  expires_at?: string // Optional expiration time
}

// Real-time monitoring types
export interface MonitoringStatus {
  total_orders: number
  pending_orders: number
  orders_checked_last_minute: number
  last_check_time: string
  active_tokens: string[]
  system_status: "running" | "stopped" | "error"
}

export interface TokenPriceData {
  token_address: string
  token_symbol: string
  price_usd: number
  price_change_24h?: number
  volume_24h?: number
  market_cap?: number
  last_updated: string
}

export interface NotificationEvent {
  type: "order_executed" | "order_expired" | "condition_met" | "system_alert"
  order_id?: string
  user_id: string // Changed from user_wallet to user_id
  message: string
  data?: Record<string, any>
  timestamp: string
}
