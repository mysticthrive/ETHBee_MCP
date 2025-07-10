/**
 * Price service for fetching real-time token prices
 */

// Cache for token prices to avoid excessive API calls
const priceCache = new Map<string, { price: number; timestamp: number }>()
const CACHE_DURATION = 60000 // 1 minute cache

/**
 * Get token price from CoinGecko API
 */
export async function getTokenPrice(symbol: string): Promise<number> {
  const cacheKey = symbol.toLowerCase()
  const cached = priceCache.get(cacheKey)
  
  // Return cached price if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.price
  }

  try {
    // Map common Solana tokens to CoinGecko IDs
    const tokenIdMap: Record<string, string> = {
      'SOL': 'solana',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'BONK': 'bonk',
      'RAY': 'raydium',
      'SRM': 'serum',
      'ORCA': 'orca',
      'MNGO': 'mango-markets',
      'STEP': 'step-finance',
      'COPE': 'cope',
      'ROPE': 'rope-token',
      'SAMO': 'samoyedcoin'
    }

    const tokenId = tokenIdMap[symbol.toUpperCase()]
    if (!tokenId) {
      console.warn(`No CoinGecko ID found for token: ${symbol}`)
      return 0
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const price = data[tokenId]?.usd || 0

    // Cache the price
    priceCache.set(cacheKey, { price, timestamp: Date.now() })

    return price
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    
    // Return fallback prices for common tokens
    const fallbackPrices: Record<string, number> = {
      'SOL': 100,
      'USDC': 1,
      'USDT': 1,
      'BONK': 0.00001,
      'RAY': 0.5,
      'ORCA': 1.5,
    }
    
    return fallbackPrices[symbol.toUpperCase()] || 0
  }
}

/**
 * Get multiple token prices at once
 */
export async function getMultipleTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}
  
  // Get prices for all symbols
  const pricePromises = symbols.map(async (symbol) => {
    const price = await getTokenPrice(symbol)
    return { symbol, price }
  })

  const results = await Promise.allSettled(pricePromises)
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      prices[symbols[index]] = result.value.price
    } else {
      console.error(`Failed to get price for ${symbols[index]}:`, result.reason)
      prices[symbols[index]] = 0
    }
  })

  return prices
}

/**
 * Clear price cache (useful for testing or manual refresh)
 */
export function clearPriceCache(): void {
  priceCache.clear()
}
