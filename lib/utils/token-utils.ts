/**
 * Toggles token caching on or off
 */
export async function toggleTokenCaching(disabled: boolean): Promise<boolean> {
  try {
    const response = await fetch("/api/token/toggle-cache", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ disabled }),
    })

    if (!response.ok) {
      throw new Error(`Failed to toggle token caching with status ${response.status}`)
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error toggling token caching:", error)
    return false
  }
}

/**
 * Gets the current token caching status
 */
export async function getTokenCachingStatus(): Promise<boolean | null> {
  try {
    const response = await fetch("/api/token/toggle-cache")

    if (!response.ok) {
      throw new Error(`Failed to get token caching status with status ${response.status}`)
    }

    const result = await response.json()
    return result.cachingDisabled
  } catch (error) {
    console.error("Error getting token caching status:", error)
    return null
  }
}

/**
 * Clears the token cache
 */
export async function clearTokenCache(): Promise<boolean> {
  try {
    const response = await fetch("/api/token/clear-cache", {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error(`Failed to clear token cache with status ${response.status}`)
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error clearing token cache:", error)
    return false
  }
}

// Token utility functions for amount conversions

// Legacy static token decimals mapping (kept for backward compatibility)
export const TOKEN_DECIMALS: Record<string, number> = {
  'So11111111111111111111111111111111111111112': 9, // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5, // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 6, // JUP
  'BALLrveijbhu42QaS2XW1pRBYfMji73bGeYJghUvQs6y': 6, // BALL
}

// Cache for dynamic token decimals
const tokenDecimalsCache = new Map<string, number>()
const DECIMALS_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes
const decimalsCacheTimestamps = new Map<string, number>()

import { getTokenDecimalsFromMint } from '@/lib/services/token-lookup-service'

/**
 * Get token decimals dynamically or from cache
 * @param tokenAddress Token mint address
 * @returns Token decimals
 */
export async function getTokenDecimals(tokenAddress: string): Promise<number> {
  // Check cache first
  const cached = tokenDecimalsCache.get(tokenAddress)
  const cacheTime = decimalsCacheTimestamps.get(tokenAddress)
  if (cached && cacheTime && Date.now() - cacheTime < DECIMALS_CACHE_DURATION) {
    return cached
  }

  // 1. Try to get from mint directly (most reliable)
  try {
    const mintDecimals = await getTokenDecimalsFromMint(tokenAddress)
    if (mintDecimals !== null) {
      // Cache the result
      tokenDecimalsCache.set(tokenAddress, mintDecimals)
      decimalsCacheTimestamps.set(tokenAddress, Date.now())
      return mintDecimals
    }
  } catch (error) {
    console.warn(`Failed to get decimals from mint for ${tokenAddress}:`, error)
  }

  // 2. Try to get from token lookup service
  try {
    const response = await fetch(`/api/token/search?symbol=${tokenAddress}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data.results.length > 0) {
        const decimals = data.data.results[0].decimals
        // Cache the result
        tokenDecimalsCache.set(tokenAddress, decimals)
        decimalsCacheTimestamps.set(tokenAddress, Date.now())
        return decimals
      }
    }
  } catch (error) {
    console.warn(`Failed to get decimals from API for ${tokenAddress}:`, error)
  }

  // 3. Fallback to static mapping
  const staticDecimals = TOKEN_DECIMALS[tokenAddress]
  if (staticDecimals !== undefined) {
    return staticDecimals
  }

  // 4. Default fallback
  return 9
}

/**
 * Convert human-readable amount to smallest unit for Jupiter API
 * @param amount Human-readable amount (e.g., 0.5)
 * @param tokenAddress Token mint address
 * @returns Amount in smallest unit as string
 */
export async function convertToSmallestUnit(amount: number | string, tokenAddress: string): Promise<string> {
  const decimals = await getTokenDecimals(tokenAddress)
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(amountNum)) {
    throw new Error(`Invalid amount: ${amount}`)
  }
  
  const smallestUnit = Math.floor(amountNum * Math.pow(10, decimals))
  return smallestUnit.toString()
}

/**
 * Convert smallest unit amount back to human-readable format
 * @param smallestUnit Amount in smallest unit
 * @param tokenAddress Token mint address
 * @returns Human-readable amount
 */
export async function convertFromSmallestUnit(smallestUnit: string | number, tokenAddress: string): Promise<number> {
  const decimals = await getTokenDecimals(tokenAddress)
  const amountNum = typeof smallestUnit === 'string' ? parseInt(smallestUnit) : smallestUnit
  
  if (isNaN(amountNum)) {
    throw new Error(`Invalid smallest unit amount: ${smallestUnit}`)
  }
  
  return amountNum / Math.pow(10, decimals)
}

/**
 * Get token address from symbol using the new lookup service
 * @param symbol Token symbol
 * @returns Token address or null if not found
 */
export async function getTokenAddressFromSymbol(symbol: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/token/search?symbol=${encodeURIComponent(symbol)}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data.results.length > 0) {
        return data.data.results[0].address
      }
    }
    return null
  } catch (error) {
    console.error(`Error getting token address for symbol ${symbol}:`, error)
    return null
  }
}

/**
 * Search tokens by symbol or name
 * @param query Search query
 * @param options Search options
 * @returns Array of matching tokens
 */
export async function searchTokens(query: string, options: {
  includeUnverified?: boolean
  maxResults?: number
  network?: 'mainnet' | 'devnet' | 'testnet'
} = {}): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      ...(options.includeUnverified && { includeUnverified: 'true' }),
      ...(options.maxResults && { maxResults: options.maxResults.toString() }),
      ...(options.network && { network: options.network })
    })

    const response = await fetch(`/api/token/search?${params}`)
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        return data.data.results
      }
    }
    return []
  } catch (error) {
    console.error(`Error searching tokens for query ${query}:`, error)
    return []
  }
}

// Legacy synchronous functions for backward compatibility
// These use the static mapping and should be replaced with async versions

/**
 * @deprecated Use convertToSmallestUnit instead
 */
export function convertToSmallestUnitSync(amount: number | string, tokenAddress: string): string {
  const decimals = TOKEN_DECIMALS[tokenAddress] || 9 // Default to 9 decimals
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(amountNum)) {
    throw new Error(`Invalid amount: ${amount}`)
  }
  
  const smallestUnit = Math.floor(amountNum * Math.pow(10, decimals))
  return smallestUnit.toString()
}

/**
 * @deprecated Use convertFromSmallestUnit instead
 */
export function convertFromSmallestUnitSync(smallestUnit: string | number, tokenAddress: string): number {
  const decimals = TOKEN_DECIMALS[tokenAddress] || 9
  const amountNum = typeof smallestUnit === 'string' ? parseInt(smallestUnit) : smallestUnit
  
  if (isNaN(amountNum)) {
    throw new Error(`Invalid smallest unit amount: ${smallestUnit}`)
  }
  
  return amountNum / Math.pow(10, decimals)
}

/**
 * Get token decimals directly from mint account (most reliable method)
 * This is the recommended approach for getting token decimals
 * @param tokenAddress Token mint address
 * @returns Token decimals or null if failed
 */
export async function getTokenDecimalsDirect(tokenAddress: string): Promise<number | null> {
  return await getTokenDecimalsFromMint(tokenAddress)
}

/**
 * Get comprehensive token info directly from mint account
 * @param tokenAddress Token mint address
 * @returns Token info including decimals, supply, authorities, etc.
 */
export async function getTokenMintInfo(tokenAddress: string): Promise<{
  decimals: number
  supply: bigint
  isInitialized: boolean
  freezeAuthority: string | null
  mintAuthority: string | null
} | null> {
  try {
    const { getMint } = await import('@solana/spl-token')
    const { Connection, PublicKey } = await import('@solana/web3.js')
    const { RPC_CONFIG } = await import('@/lib/config/rpc-config')
    
    const connection = new Connection(RPC_CONFIG.getBestRpcUrl(), 'confirmed')
    const mintPublicKey = new PublicKey(tokenAddress)
    
    const mintInfo = await getMint(connection, mintPublicKey)
    
    return {
      decimals: mintInfo.decimals,
      supply: mintInfo.supply,
      isInitialized: mintInfo.isInitialized,
      freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
      mintAuthority: mintInfo.mintAuthority?.toString() || null,
    }
  } catch (error) {
    console.error(`Error getting mint info for ${tokenAddress}:`, error)
    return null
  }
}
