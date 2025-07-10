import { useState, useEffect, useCallback } from 'react'
import { searchTokens, getTokenAddressFromSymbol } from '@/lib/utils/token-utils'

export interface TokenSearchResult {
  address: string
  symbol: string
  name: string
  decimals: number
  logoUrl?: string
  source: 'jupiter' | 'solana-token-list' | 'on-chain' | 'cache'
  verified: boolean
  metadata?: any
}

export interface UseTokenLookupOptions {
  includeUnverified?: boolean
  maxResults?: number
  network?: 'mainnet' | 'devnet' | 'testnet'
  debounceMs?: number
}

export interface UseTokenLookupReturn {
  // Search functionality
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: TokenSearchResult[]
  isSearching: boolean
  searchError: string | null
  
  // Direct lookup functionality
  getTokenAddress: (symbol: string) => Promise<string | null>
  getTokenInfo: (symbol: string) => Promise<TokenSearchResult | null>
  
  // Utility functions
  clearSearch: () => void
  clearError: () => void
}

/**
 * React hook for token lookup functionality
 */
export function useTokenLookup(options: UseTokenLookupOptions = {}): UseTokenLookupReturn {
  const {
    includeUnverified = false,
    maxResults = 10,
    network = 'mainnet',
    debounceMs = 300
  } = options

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TokenSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setSearchError(null)

      try {
        const results = await searchTokens(searchQuery, {
          includeUnverified,
          maxResults,
          network
        })
        setSearchResults(results)
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : 'Failed to search tokens')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, debounceMs)

    setDebounceTimer(timer)

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [searchQuery, includeUnverified, maxResults, network, debounceMs])

  // Direct token address lookup
  const getTokenAddress = useCallback(async (symbol: string): Promise<string | null> => {
    try {
      return await getTokenAddressFromSymbol(symbol)
    } catch (error) {
      console.error(`Error getting token address for ${symbol}:`, error)
      return null
    }
  }, [])

  // Direct token info lookup
  const getTokenInfo = useCallback(async (symbol: string): Promise<TokenSearchResult | null> => {
    try {
      const results = await searchTokens(symbol, {
        includeUnverified,
        maxResults: 1,
        network
      })
      return results.length > 0 ? results[0] : null
    } catch (error) {
      console.error(`Error getting token info for ${symbol}:`, error)
      return null
    }
  }, [includeUnverified, network])

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setSearchError(null)
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  }, [debounceTimer])

  // Clear error
  const clearError = useCallback(() => {
    setSearchError(null)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    getTokenAddress,
    getTokenInfo,
    clearSearch,
    clearError
  }
}

/**
 * Hook for getting token address from symbol (simplified version)
 */
export function useTokenAddress(symbol: string): {
  address: string | null
  isLoading: boolean
  error: string | null
} {
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol.trim()) {
      setAddress(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    getTokenAddressFromSymbol(symbol)
      .then((result) => {
        setAddress(result)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to get token address')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [symbol])

  return { address, isLoading, error }
}

/**
 * Hook for getting token info from symbol (simplified version)
 */
export function useTokenInfo(symbol: string): {
  tokenInfo: TokenSearchResult | null
  isLoading: boolean
  error: string | null
} {
  const [tokenInfo, setTokenInfo] = useState<TokenSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol.trim()) {
      setTokenInfo(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    searchTokens(symbol, { maxResults: 1 })
      .then((results) => {
        setTokenInfo(results.length > 0 ? results[0] : null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to get token info')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [symbol])

  return { tokenInfo, isLoading, error }
} 