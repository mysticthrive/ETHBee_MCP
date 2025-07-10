import {
  BookingOrder,
  OrderEvaluationResult,
  TokenPriceData,
  ConditionEvaluationResult,
  PriceCondition,
  TimeCondition,
  MarketCondition,
  MonitoringStatus
} from '@/lib/types/booking-order-types';
import {
  getPendingBookingOrders,
  updateOrderCheckStatus,
  markOrderAsExecuted,
  evaluatePriceCondition,
  evaluateTimeCondition,
  evaluateMarketCondition
} from './booking-order-service';
import { realTimePriceService, TokenPriceData as RealTimePriceData } from '@/lib/services/real-time-price-service';
import { logError } from '@/lib/utils/error-utils';

/**
 * Real-time booking order monitoring service
 */
export class BookingMonitorService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval = 10000; // 10 seconds (faster with WebSocket)
  private lastCheckTime = new Date();
  private ordersCheckedLastMinute = 0;
  private activeTokens = new Set<string>();
  private ordersByToken = new Map<string, BookingOrder[]>();
  private priceUpdateHandlers = new Map<string, (priceData: RealTimePriceData) => void>();

  /**
   * Starts the monitoring service
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Booking monitor service is already running');
      return;
    }

    console.log('Starting booking order monitoring service with WebSocket support...');
    this.isRunning = true;
    this.lastCheckTime = new Date();

    // Set up real-time price event listeners
    this.setupPriceEventListeners();

    // Run initial check to load orders and subscribe to tokens
    this.checkBookingOrders();

    // Set up interval for periodic order refresh (less frequent with WebSocket)
    this.intervalId = setInterval(() => {
      this.refreshBookingOrders();
    }, this.checkInterval);

    console.log(`Booking monitor service started with ${this.checkInterval}ms refresh interval`);
  }

  /**
   * Stops the monitoring service
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('Booking monitor service is not running');
      return;
    }

    console.log('Stopping booking order monitoring service...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Cleanup WebSocket subscriptions
    this.cleanupWebSocketSubscriptions();

    console.log('Booking monitor service stopped');
  }

  /**
   * Gets the current monitoring status
   */
  public getStatus(): MonitoringStatus {
    return {
      total_orders: 0, // This would be fetched from database
      pending_orders: 0, // This would be fetched from database
      orders_checked_last_minute: this.ordersCheckedLastMinute,
      last_check_time: this.lastCheckTime.toISOString(),
      active_tokens: Array.from(this.activeTokens),
      system_status: this.isRunning ? 'running' : 'stopped'
    };
  }

  /**
   * Setup real-time price event listeners
   */
  private setupPriceEventListeners(): void {
    // Listen for price updates from the real-time service
    realTimePriceService.on('priceUpdate', (priceData: RealTimePriceData) => {
      this.handleRealTimePriceUpdate(priceData);
    });

    console.log('Real-time price event listeners setup complete');
  }

  /**
   * Handle real-time price updates from WebSocket
   */
  private handleRealTimePriceUpdate(priceData: RealTimePriceData): void {
    const tokenSymbol = priceData.symbol;
    const orders = this.ordersByToken.get(tokenSymbol) || [];

    if (orders.length === 0) {
      return; // No orders for this token
    }

    console.log(`Real-time price update for ${tokenSymbol}: $${priceData.price}`);

    // Convert to our TokenPriceData format
    const tokenData: TokenPriceData = {
      token_address: priceData.address,
      token_symbol: priceData.symbol,
      price_usd: priceData.price,
      price_change_24h: priceData.priceChange24h,
      volume_24h: priceData.volume24h,
      market_cap: priceData.marketCap,
      last_updated: new Date(priceData.timestamp).toISOString()
    };

    // Evaluate all orders for this token immediately
    for (const order of orders) {
      this.evaluateOrderWithRealTimeData(order, tokenData);
    }
  }

  /**
   * Cleanup WebSocket subscriptions
   */
  private cleanupWebSocketSubscriptions(): void {
    // Unsubscribe from all tokens
    for (const tokenSymbol of this.activeTokens) {
      realTimePriceService.unsubscribeFromToken(tokenSymbol);
    }

    // Clear local data
    this.activeTokens.clear();
    this.ordersByToken.clear();
    this.priceUpdateHandlers.clear();

    console.log('WebSocket subscriptions cleaned up');
  }

  /**
   * Main monitoring loop - loads orders and sets up WebSocket subscriptions
   */
  private async checkBookingOrders(): Promise<void> {
    try {
      console.log('Loading booking orders and setting up WebSocket subscriptions...');
      this.lastCheckTime = new Date();

      // Get all pending booking orders
      const pendingOrders = await getPendingBookingOrders();
      console.log(`Found ${pendingOrders.length} pending booking orders`);

      if (pendingOrders.length === 0) {
        return;
      }

      // Group orders by token symbol for WebSocket subscriptions
      this.ordersByToken.clear();
      this.activeTokens.clear();

      for (const order of pendingOrders) {
        const tokenSymbol = order.token_symbol;

        if (!this.ordersByToken.has(tokenSymbol)) {
          this.ordersByToken.set(tokenSymbol, []);
        }
        this.ordersByToken.get(tokenSymbol)!.push(order);
        this.activeTokens.add(tokenSymbol);
      }

      // Subscribe to WebSocket updates for all active tokens
      for (const tokenSymbol of this.activeTokens) {
        const orders = this.ordersByToken.get(tokenSymbol)!;
        const tokenAddress = orders[0].token_address;

        try {
          await realTimePriceService.subscribeToToken(tokenSymbol, tokenAddress);
          console.log(`Subscribed to real-time updates for ${tokenSymbol}`);
        } catch (error) {
          console.warn(`Failed to subscribe to ${tokenSymbol}:`, error);
        }
      }

      console.log(`Setup complete: monitoring ${this.activeTokens.size} tokens with ${pendingOrders.length} orders`);
    } catch (error) {
      logError(error, 'BookingMonitorService.checkBookingOrders');
      console.error('Error in booking orders setup:', error);
    }
  }

  /**
   * Refresh booking orders periodically (less frequent with WebSocket)
   */
  private async refreshBookingOrders(): Promise<void> {
    try {
      console.log('Refreshing booking orders...');

      // Get updated list of pending orders
      const pendingOrders = await getPendingBookingOrders();
      const currentTokens = new Set<string>();
      const newOrdersByToken = new Map<string, BookingOrder[]>();

      // Group new orders
      for (const order of pendingOrders) {
        const tokenSymbol = order.token_symbol;
        currentTokens.add(tokenSymbol);

        if (!newOrdersByToken.has(tokenSymbol)) {
          newOrdersByToken.set(tokenSymbol, []);
        }
        newOrdersByToken.get(tokenSymbol)!.push(order);
      }

      // Find tokens to unsubscribe from (no longer have orders)
      for (const tokenSymbol of this.activeTokens) {
        if (!currentTokens.has(tokenSymbol)) {
          realTimePriceService.unsubscribeFromToken(tokenSymbol);
          console.log(`Unsubscribed from ${tokenSymbol} (no active orders)`);
        }
      }

      // Find new tokens to subscribe to
      for (const tokenSymbol of currentTokens) {
        if (!this.activeTokens.has(tokenSymbol)) {
          const orders = newOrdersByToken.get(tokenSymbol)!;
          const tokenAddress = orders[0].token_address;

          try {
            await realTimePriceService.subscribeToToken(tokenSymbol, tokenAddress);
            console.log(`Subscribed to new token: ${tokenSymbol}`);
          } catch (error) {
            console.warn(`Failed to subscribe to new token ${tokenSymbol}:`, error);
          }
        }
      }

      // Update local state
      this.ordersByToken = newOrdersByToken;
      this.activeTokens = currentTokens;

      console.log(`Refresh complete: monitoring ${this.activeTokens.size} tokens with ${pendingOrders.length} orders`);
    } catch (error) {
      logError(error, 'BookingMonitorService.refreshBookingOrders');
      console.error('Error refreshing booking orders:', error);
    }
  }

  /**
   * Evaluate order with real-time price data
   */
  private async evaluateOrderWithRealTimeData(order: BookingOrder, tokenData: TokenPriceData): Promise<void> {
    try {
      // Update check status
      await updateOrderCheckStatus(order.id!);
      this.ordersCheckedLastMinute++;

      // Evaluate all conditions
      const conditionResults: ConditionEvaluationResult[] = [];

      for (const condition of order.conditions) {
        let result: ConditionEvaluationResult;

        switch (condition.condition_type) {
          case 'price':
            result = await evaluatePriceCondition(condition.condition_details as PriceCondition, tokenData);
            break;
          case 'time':
            result = evaluateTimeCondition(condition.condition_details as TimeCondition);
            break;
          case 'market':
            result = await evaluateMarketCondition(condition.condition_details as MarketCondition, tokenData);
            break;
          default:
            result = {
              condition_type: condition.condition_type,
              met: false,
              details: `Unknown condition type: ${condition.condition_type}`
            };
        }

        conditionResults.push(result);
      }

      // Apply logic (AND/OR) to determine if order should execute
      const shouldExecute = this.evaluateLogic(order.logic_type, conditionResults);

      if (shouldExecute) {
        console.log(`🚀 Order ${order.id} conditions met via real-time data, executing...`);
        await this.executeOrder(order, tokenData, conditionResults);

        // Remove executed order from local tracking
        this.removeOrderFromTracking(order);
      }
    } catch (error) {
      logError(error, 'BookingMonitorService.evaluateOrderWithRealTimeData', { orderId: order.id });
    }
  }

  /**
   * Remove executed order from local tracking
   */
  private removeOrderFromTracking(executedOrder: BookingOrder): void {
    const tokenSymbol = executedOrder.token_symbol;
    const orders = this.ordersByToken.get(tokenSymbol);

    if (orders) {
      const filteredOrders = orders.filter(order => order.id !== executedOrder.id);

      if (filteredOrders.length === 0) {
        // No more orders for this token, unsubscribe
        this.ordersByToken.delete(tokenSymbol);
        this.activeTokens.delete(tokenSymbol);
        realTimePriceService.unsubscribeFromToken(tokenSymbol);
        console.log(`Unsubscribed from ${tokenSymbol} (order executed, no remaining orders)`);
      } else {
        // Update with remaining orders
        this.ordersByToken.set(tokenSymbol, filteredOrders);
      }
    }
  }

  /**
   * Gets current token data from real-time service or fallback API
   */
  private async getTokenData(tokenAddress: string, tokenSymbol: string): Promise<TokenPriceData | null> {
    try {
      // First try to get from real-time service cache
      const cachedPrice = realTimePriceService.getCurrentPrice(tokenSymbol);
      if (cachedPrice) {
        return {
          token_address: tokenAddress,
          token_symbol: tokenSymbol,
          price_usd: cachedPrice.price,
          price_change_24h: cachedPrice.priceChange24h,
          volume_24h: cachedPrice.volume24h,
          market_cap: cachedPrice.marketCap,
          last_updated: new Date(cachedPrice.timestamp).toISOString()
        };
      }

      // Fallback to API if not in cache
      const response = await fetch('/api/token/price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          symbol: tokenSymbol,
        }),
      });

      if (!response.ok) {
        console.log(`Failed to get price for ${tokenSymbol} (${tokenAddress})`);
        return null;
      }

      const priceData = await response.json();

      if (!priceData.price?.usd) {
        console.log(`No price available for ${tokenSymbol}`);
        return null;
      }

      return {
        token_address: tokenAddress,
        token_symbol: tokenSymbol,
        price_usd: priceData.price.usd,
        price_change_24h: priceData.price.usd_24h_change,
        volume_24h: priceData.market_data?.volume_24h,
        market_cap: priceData.market_data?.market_cap,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      logError(error, 'BookingMonitorService.getTokenData', { tokenAddress, tokenSymbol });
      return null;
    }
  }



  /**
   * Applies AND/OR logic to condition results
   */
  private evaluateLogic(logicType: 'AND' | 'OR', results: ConditionEvaluationResult[]): boolean {
    if (results.length === 0) return false;

    if (logicType === 'AND') {
      return results.every(result => result.met);
    } else {
      return results.some(result => result.met);
    }
  }

  /**
   * Executes a booking order when conditions are met
   */
  private async executeOrder(
    order: BookingOrder,
    tokenData: TokenPriceData,
    conditionResults: ConditionEvaluationResult[]
  ): Promise<void> {
    try {
      console.log(`Executing booking order ${order.id} for ${order.action_type}`);

      // For now, we'll mark as executed with current price
      // In a real implementation, this would call the actual trading API
      const executionDetails = {
        conditions_met: conditionResults,
        execution_time: new Date().toISOString(),
        token_data: tokenData
      };

      const result = await markOrderAsExecuted(
        order.id!,
        tokenData.price_usd,
        `booking_${order.id}_${Date.now()}`, // Mock transaction hash
        executionDetails
      );

      if (result.success) {
        console.log(`Successfully executed booking order ${order.id}`);
        // Here you would typically send a notification to the user
      } else {
        console.error(`Failed to mark order ${order.id} as executed:`, result.error);
      }
    } catch (error) {
      logError(error, 'BookingMonitorService.executeOrder', { orderId: order.id });
    }
  }
}

// Export singleton instance
export const bookingMonitor = new BookingMonitorService();
