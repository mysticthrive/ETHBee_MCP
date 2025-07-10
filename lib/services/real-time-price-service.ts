import { EventEmitter } from "events"

export interface TokenPriceData {
  symbol: string
  address: string
  price: number
  priceChange24h?: number
  volume24h?: number
  marketCap?: number
  timestamp: number
  source: string
}

export interface PriceAlert {
  id: string
  tokenSymbol: string
  tokenAddress: string
  condition: "above" | "below" | "equals"
  targetPrice: number
  callback: (data: TokenPriceData) => void
  isActive: boolean
}

export class RealTimePriceService extends EventEmitter {
  private priceCache: Map<string, TokenPriceData> = new Map()
  private priceAlerts: Map<string, PriceAlert> = new Map()
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private lastFetchTime: Map<string, number> = new Map()
  private minFetchInterval = 5000 // Minimum 5 seconds between fetches for the same token
  private maxRetries = 3
  private retryDelay = 2000

  constructor() {
    super()
    this.setupErrorHandling()
  }

  /**
   * Subscribe to real-time price updates for a token
   */
  async subscribeToToken(tokenSymbol: string, tokenAddress?: string): Promise<void> {
    console.log(`Subscribing to price updates for ${tokenSymbol}`)
    this.setupPollingConnection(tokenSymbol, tokenAddress)
  }

  /**
   * Unsubscribe from token updates
   */
  unsubscribeFromToken(tokenSymbol: string): void {
    console.log(`Unsubscribing from ${tokenSymbol}`)

    // Clear polling interval
    const interval = this.pollingIntervals.get(tokenSymbol)
    if (interval) {
      clearInterval(interval)
      this.pollingIntervals.delete(tokenSymbol)
    }

    // Remove from cache
    this.priceCache.delete(tokenSymbol)
  }

  /**
   * Add a price alert that triggers when conditions are met
   */
  addPriceAlert(alert: Omit<PriceAlert, "id">): string {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const fullAlert: PriceAlert = { ...alert, id }

    this.priceAlerts.set(id, fullAlert)

    // Subscribe to token if not already subscribed
    if (!this.priceCache.has(alert.tokenSymbol)) {
      this.subscribeToToken(alert.tokenSymbol, alert.tokenAddress)
    }

    console.log(`Added price alert: ${alert.tokenSymbol} ${alert.condition} $${alert.targetPrice}`)
    return id
  }

  /**
   * Remove a price alert
   */
  removePriceAlert(alertId: string): boolean {
    const alert = this.priceAlerts.get(alertId)
    if (alert) {
      this.priceAlerts.delete(alertId)
      console.log(`Removed price alert: ${alertId}`)

      // Check if we still need to monitor this token
      const hasOtherAlerts = Array.from(this.priceAlerts.values()).some(
        (a) => a.tokenSymbol === alert.tokenSymbol && a.isActive,
      )

      if (!hasOtherAlerts) {
        this.unsubscribeFromToken(alert.tokenSymbol)
      }

      return true
    }
    return false
  }

  /**
   * Get current price for a token
   */
  getCurrentPrice(tokenSymbol: string): TokenPriceData | null {
    return this.priceCache.get(tokenSymbol) || null
  }

  /**
   * Get all active price alerts
   */
  getActiveAlerts(): PriceAlert[] {
    return Array.from(this.priceAlerts.values()).filter((alert) => alert.isActive)
  }

  /**
   * Setup polling connection for price updates
   */
  private setupPollingConnection(tokenSymbol: string, tokenAddress?: string): void {
    // Clear any existing interval
    const existingInterval = this.pollingIntervals.get(tokenSymbol)
    if (existingInterval) {
      clearInterval(existingInterval)
    }

    // Initial fetch
    this.fetchTokenPriceWithRetry(tokenSymbol, tokenAddress).then(priceData => {
      if (priceData) {
        this.handlePriceUpdate(tokenSymbol, priceData)
      }
    })

    // Set up polling interval
    const interval = setInterval(async () => {
      try {
        const priceData = await this.fetchTokenPriceWithRetry(tokenSymbol, tokenAddress)
        if (priceData) {
          this.handlePriceUpdate(tokenSymbol, priceData)
        }
      } catch (error) {
        console.error(`Error polling price for ${tokenSymbol}:`, error)
      }
    }, 10000) // Poll every 10 seconds

    this.pollingIntervals.set(tokenSymbol, interval)
    console.log(`Started polling for ${tokenSymbol}`)
  }

  /**
   * Fetch token price with retry logic
   */
  private async fetchTokenPriceWithRetry(
    tokenSymbol: string,
    tokenAddress?: string,
    retryCount = 0
  ): Promise<TokenPriceData | null> {
    try {
      // Check rate limiting
      const lastFetch = this.lastFetchTime.get(tokenSymbol) || 0
      const now = Date.now()
      if (now - lastFetch < this.minFetchInterval) {
        return this.priceCache.get(tokenSymbol) || null
      }

      const priceData = await this.fetchTokenPrice(tokenSymbol, tokenAddress)
      if (priceData) {
        this.lastFetchTime.set(tokenSymbol, now)
        return priceData
      }

      // Retry logic
      if (retryCount < this.maxRetries) {
        console.log(`Retrying price fetch for ${tokenSymbol} (attempt ${retryCount + 1})`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.fetchTokenPriceWithRetry(tokenSymbol, tokenAddress, retryCount + 1)
      }

      return null
    } catch (error) {
      console.error(`Error in fetchTokenPriceWithRetry for ${tokenSymbol}:`, error)
      if (retryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.fetchTokenPriceWithRetry(tokenSymbol, tokenAddress, retryCount + 1)
      }
      return null
    }
  }

  /**
   * Fetch token price from API
   */
  private async fetchTokenPrice(tokenSymbol: string, tokenAddress?: string): Promise<TokenPriceData | null> {
    try {
      // Try Jupiter API first for Solana tokens
      if (tokenAddress) {
        const jupiterResponse = await fetch(`https://lite-api.jup.ag/price/v2?ids=${tokenAddress}`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        })
        
        if (jupiterResponse.ok) {
          const data = await jupiterResponse.json()
          console.log("💚");
          console.log(data);
          if (data.data && data.data[tokenAddress]) {
            const priceInfo = data.data[tokenAddress]
            console.log(`💲 Jupiter price for ${tokenSymbol}: $${priceInfo.price}`)
            return {
              symbol: tokenSymbol,
              address: tokenAddress,
              price: priceInfo.price,
              timestamp: Date.now(),
              source: "jupiter",
            }
          }
        }
      }

      // Try Birdeye API as second option for Solana tokens
      if (tokenAddress) {
        try {
          const birdeyeResponse = await fetch(`https://public-api.birdeye.so/public/price?address=${tokenAddress}`, {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          })
          
          if (birdeyeResponse.ok) {
            const data = await birdeyeResponse.json()
            if (data.success && data.data?.value) {
              console.log(`💲 Birdeye price for ${tokenSymbol}: $${data.data.value}`)
              return {
                symbol: tokenSymbol,
                address: tokenAddress,
                price: data.data.value,
                timestamp: Date.now(),
                source: "birdeye",
              }
            }
          }
        } catch (error) {
          console.warn(`Birdeye API failed for ${tokenSymbol}:`, error)
        }
      }

      // Fallback to CoinGecko for known tokens
      const knownTokenIds: Record<string, string> = {
        SOL: "solana",
        BONK: "bonk",
        JUP: "jupiter-exchange-solana",
        ORCA: "orca",
        RAY: "raydium",
        SAMO: "samoyedcoin",
        USDC: "usd-coin",
        USDT: "tether",
      }

      const tokenId = knownTokenIds[tokenSymbol.toUpperCase()]
      if (tokenId) {
        const cgResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
          {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        )

        if (cgResponse.ok) {
          const data = await cgResponse.json()
          if (data[tokenId]) {
            const tokenData = data[tokenId]
            console.log(`💲 CoinGecko price for ${tokenSymbol}: $${tokenData.usd}`)
            return {
              symbol: tokenSymbol,
              address: tokenAddress || "",
              price: tokenData.usd,
              priceChange24h: tokenData.usd_24h_change,
              volume24h: tokenData.usd_24h_vol,
              marketCap: tokenData.usd_market_cap,
              timestamp: Date.now(),
              source: "coingecko",
            }
          }
        }
      }

      console.warn(`No price data available for ${tokenSymbol}`)
      return null
    } catch (error) {
      console.error(`Error fetching price for ${tokenSymbol}:`, error)
      return null
    }
  }

  /**
   * Handle price update and emit event
   */
  private handlePriceUpdate(tokenSymbol: string, data: any): void {
    const currentPrice = this.priceCache.get(tokenSymbol)
    const priceChanged = !currentPrice || currentPrice.price !== data.price

    const priceData: TokenPriceData = {
      symbol: tokenSymbol,
      address: data.address || "",
      price: data.price,
      priceChange24h: data.priceChange24h,
      volume24h: data.volume24h,
      marketCap: data.marketCap,
      timestamp: Date.now(),
      source: data.source || "unknown",
    }

    // Update cache
    this.priceCache.set(tokenSymbol, priceData)

    // Only emit if price has changed
    if (priceChanged) {
      console.log(`Price update for ${tokenSymbol}: $${priceData.price} (${priceData.source})`)
      this.emit("priceUpdate", priceData)
      this.checkPriceAlerts(priceData)
    }
  }

  /**
   * Check if any price alerts should be triggered
   */
  private checkPriceAlerts(priceData: TokenPriceData): void {
    const alerts = Array.from(this.priceAlerts.values()).filter(
      (alert) => alert.tokenSymbol === priceData.symbol && alert.isActive,
    )

    for (const alert of alerts) {
      let shouldTrigger = false

      switch (alert.condition) {
        case "above":
          shouldTrigger = priceData.price >= alert.targetPrice
          break
        case "below":
          shouldTrigger = priceData.price <= alert.targetPrice
          break
        case "equals":
          // Allow for small price variations (0.1%)
          const tolerance = alert.targetPrice * 0.001
          shouldTrigger = Math.abs(priceData.price - alert.targetPrice) <= tolerance
          break
      }

      if (shouldTrigger) {
        console.log(`Price alert triggered: ${alert.tokenSymbol} ${alert.condition} $${alert.targetPrice}`)

        // Deactivate the alert to prevent multiple triggers
        alert.isActive = false

        // Call the callback
        try {
          alert.callback(priceData)
        } catch (error) {
          console.error("Error in price alert callback:", error)
        }

        // Emit alert triggered event
        this.emit("alertTriggered", { alert, priceData })
      }
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    process.on("uncaughtException", (error) => {
      console.error("Uncaught exception in price service:", error)
    })

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled rejection in price service:", error)
    })
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Clear all polling intervals
    for (const interval of this.pollingIntervals.values()) {
      clearInterval(interval)
    }
    this.pollingIntervals.clear()
    this.priceCache.clear()
    this.priceAlerts.clear()
  }
}

// Singleton instance
export const realTimePriceService = new RealTimePriceService()
