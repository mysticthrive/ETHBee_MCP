import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token'
import { RPC_CONFIG } from '@/lib/config/rpc-config'
import { logError } from '@/lib/utils/error-utils'

export interface TokenLookupResult {
  address: string
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
  source: 'jupiter' | 'solana-token-list' | 'on-chain' | 'cache'
  verified: boolean
  metadata?: any
}

export interface TokenSearchOptions {
  includeUnverified?: boolean
  maxResults?: number
  network?: 'mainnet' | 'devnet' | 'testnet'
}

// Cache for token lookups to improve performance
const tokenLookupCache = new Map<string, TokenLookupResult[]>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const cacheTimestamps = new Map<string, number>()

/**
 * Get a Solana connection instance
 */
function getConnection(): Connection {
  return new Connection(RPC_CONFIG.getBestRpcUrl(), 'confirmed')
}

/**
 * Search for tokens by symbol or name
 * @param query The symbol or name to search for
 * @param options Search options
 * @returns Array of matching tokens
 */
export async function searchTokensBySymbolOrName(
  query: string,
  options: TokenSearchOptions = {}
): Promise<TokenLookupResult[]> {
  const { includeUnverified = false, maxResults = 10, network = 'mainnet' } = options
  const cacheKey = `${query.toLowerCase()}-${network}-${includeUnverified}`
  
  // Check cache first
  const cached = tokenLookupCache.get(cacheKey)
  const cacheTime = cacheTimestamps.get(cacheKey)
  if (cached && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return cached.slice(0, maxResults)
  }

  const results: TokenLookupResult[] = []
  
  try {
    // 1. Try Jupiter API first (most comprehensive)
    const jupiterResults = await searchJupiterTokens(query, includeUnverified)
    results.push(...jupiterResults)

    // 2. Try Solana Token List as fallback
    if (results.length < maxResults) {
      const solanaResults = await searchSolanaTokenList(query, includeUnverified)
      // Merge results, avoiding duplicates
      for (const result of solanaResults) {
        if (!results.some(r => r.address === result.address)) {
          results.push(result)
        }
      }
    }

    // 3. If still no results, try on-chain search (expensive, use sparingly)
    if (results.length === 0 && query.length >= 3) {
      const onChainResults = await searchOnChainTokens(query, includeUnverified)
      results.push(...onChainResults)
    }

    // Sort by relevance (verified tokens first, then by symbol match)
    results.sort((a, b) => {
      // Verified tokens first
      if (a.verified && !b.verified) return -1
      if (!a.verified && b.verified) return 1
      
      // Exact symbol match
      const aExactSymbol = a.symbol.toLowerCase() === query.toLowerCase()
      const bExactSymbol = b.symbol.toLowerCase() === query.toLowerCase()
      if (aExactSymbol && !bExactSymbol) return -1
      if (!aExactSymbol && bExactSymbol) return 1
      
      // Symbol starts with query
      const aStartsWith = a.symbol.toLowerCase().startsWith(query.toLowerCase())
      const bStartsWith = b.symbol.toLowerCase().startsWith(query.toLowerCase())
      if (aStartsWith && !bStartsWith) return -1
      if (!aStartsWith && bStartsWith) return 1
      
      // Name starts with query
      const aNameStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase())
      const bNameStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase())
      if (aNameStartsWith && !bNameStartsWith) return -1
      if (!aNameStartsWith && bNameStartsWith) return 1
      
      return 0
    })

    // Cache the results
    tokenLookupCache.set(cacheKey, results)
    cacheTimestamps.set(cacheKey, Date.now())

    return results.slice(0, maxResults)
  } catch (error) {
    logError(error, 'searchTokensBySymbolOrName', { query, options })
    return []
  }
}

/**
 * Get token address from symbol
 * @param symbol Token symbol
 * @param options Search options
 * @returns Token address or null if not found
 */
export async function getTokenAddressFromSymbol(
  symbol: string,
  options: TokenSearchOptions = {}
): Promise<string | null> {
  const results = await searchTokensBySymbolOrName(symbol, { ...options, maxResults: 1 })
  return results.length > 0 ? results[0].address : null
}

/**
 * Get token info from symbol
 * @param symbol Token symbol
 * @param options Search options
 * @returns Token info or null if not found
 */
export async function getTokenInfoFromSymbol(
  symbol: string,
  options: TokenSearchOptions = {}
): Promise<TokenLookupResult | null> {
  const results = await searchTokensBySymbolOrName(symbol, { ...options, maxResults: 1 })
  return results.length > 0 ? results[0] : null
}

/**
 * Search tokens using Jupiter API
 */
async function searchJupiterTokens(query: string, includeUnverified: boolean): Promise<TokenLookupResult[]> {
  try {
    const response = await fetch('https://token.jup.ag/all')
    if (!response.ok) {
      throw new Error(`Jupiter API returned status ${response.status}`)
    }

    const tokens = await response.json()
    const results: TokenLookupResult[] = []

    for (const token of tokens) {
      const symbolMatch = token.symbol?.toLowerCase().includes(query.toLowerCase())
      const nameMatch = token.name?.toLowerCase().includes(query.toLowerCase())
      
      if (symbolMatch || nameMatch) {
        // Skip unverified tokens unless explicitly requested
        if (!includeUnverified && !token.verified) continue

        results.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoUrl: token.logoURI,
          source: 'jupiter',
          verified: token.verified || false,
          metadata: {
            coingeckoId: token.extensions?.coingeckoId,
            website: token.extensions?.website,
            twitter: token.extensions?.twitter,
          }
        })
      }
    }

    return results
  } catch (error) {
    logError(error, 'searchJupiterTokens', { query })
    return []
  }
}

/**
 * Search tokens using Solana Token List
 */
async function searchSolanaTokenList(query: string, includeUnverified: boolean): Promise<TokenLookupResult[]> {
  try {
    const response = await fetch('https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json')
    if (!response.ok) {
      throw new Error(`Solana Token List API returned status ${response.status}`)
    }

    const data = await response.json()
    const results: TokenLookupResult[] = []

    for (const token of data.tokens) {
      const symbolMatch = token.symbol?.toLowerCase().includes(query.toLowerCase())
      const nameMatch = token.name?.toLowerCase().includes(query.toLowerCase())
      
      if (symbolMatch || nameMatch) {
        results.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoUrl: token.logoURI,
          source: 'solana-token-list',
          verified: true, // Solana token list tokens are considered verified
          metadata: {
            tags: token.tags,
            extensions: token.extensions,
          }
        })
      }
    }

    return results
  } catch (error) {
    logError(error, 'searchSolanaTokenList', { query })
    return []
  }
}

/**
 * Search tokens on-chain (expensive operation, use sparingly)
 */
async function searchOnChainTokens(query: string, includeUnverified: boolean): Promise<TokenLookupResult[]> {
  try {
    const connection = getConnection()
    
    // This is a simplified approach - in practice, you'd want to use a more sophisticated method
    // like indexing services or pre-built token databases
    
    // For now, we'll return an empty array as on-chain search is expensive
    // In a production environment, you might want to use:
    // - Helius API for enhanced token search
    // - Pre-built token databases
    // - Indexing services like The Graph
    
    return []
  } catch (error) {
    logError(error, 'searchOnChainTokens', { query })
    return []
  }
}

/**
 * Get token decimals directly from the mint account
 * @param tokenAddress Token mint address
 * @returns Token decimals
 */
export async function getTokenDecimalsFromMint(tokenAddress: string): Promise<number | null> {
  try {
    const connection = getConnection()
    const mintPublicKey = new PublicKey(tokenAddress)
    
    // Get mint info directly from the blockchain
    const mintInfo = await getMint(connection, mintPublicKey)
    return mintInfo.decimals
  } catch (error) {
    logError(error, 'getTokenDecimalsFromMint', { tokenAddress })
    return null
  }
}

/**
 * Validate token address and get metadata
 * @param address Token address
 * @returns Token info or null if invalid
 */
export async function validateTokenAddress(address: string): Promise<TokenLookupResult | null> {
  try {
    const connection = getConnection()
    const pubkey = new PublicKey(address)
    
    // Check if account exists
    const accountInfo = await connection.getAccountInfo(pubkey)
    if (!accountInfo) {
      return null
    }

    // Check if it's owned by Token Program
    if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      return null
    }

    // Get token decimals directly from mint using getMint
    let decimals: number
    let mintInfo: any
    try {
      mintInfo = await getMint(connection, pubkey)
      decimals = mintInfo.decimals
    } catch (error) {
      logError(error, 'validateTokenAddress - Error getting mint info', { address })
      return null
    }

    // Try to get metadata from Jupiter
    try {
      const jupiterResponse = await fetch(`https://lite-api.jup.ag/tokens/v1/token/${address}`)
      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json()
        return {
          address,
          symbol: jupiterData.symbol || 'UNKNOWN',
          name: jupiterData.name || 'Unknown Token',
          decimals: jupiterData.decimals || decimals,
          logoUrl: jupiterData.logoURI,
          source: 'jupiter',
          verified: jupiterData.verified || false,
          metadata: jupiterData
        }
      }
    } catch (error) {
      // Continue to fallback
    }

    // Fallback to basic info with accurate decimals from mint
    return {
      address,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: decimals,
      source: 'on-chain',
      verified: false,
      metadata: {
        supply: mintInfo.supply,
        isInitialized: mintInfo.isInitialized,
        freezeAuthority: mintInfo.freezeAuthority?.toString(),
        mintAuthority: mintInfo.mintAuthority?.toString(),
      }
    }
  } catch (error) {
    logError(error, 'validateTokenAddress', { address })
    return null
  }
}

/**
 * Clear the token lookup cache
 */
export function clearTokenLookupCache(): void {
  tokenLookupCache.clear()
  cacheTimestamps.clear()
}

/**
 * Get cache statistics
 */
export function getTokenLookupCacheStats(): { size: number; entries: string[] } {
  return {
    size: tokenLookupCache.size,
    entries: Array.from(tokenLookupCache.keys())
  }
} 