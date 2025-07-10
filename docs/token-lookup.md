# Dynamic Token Lookup System

This document describes the new dynamic token lookup system that replaces static token mappings with real-time token discovery using multiple data sources.

## Overview

The dynamic token lookup system allows you to:
- Search for tokens by symbol or name
- Get token addresses dynamically from symbols
- Retrieve comprehensive token metadata
- **Get token decimals directly from the blockchain using `getMint`** ⭐
- Support multiple data sources (Jupiter API, Solana Token List)
- Cache results for performance
- Validate token addresses on-chain

## 🎯 **Recommended Approach: getMint**

The **most reliable and recommended method** for getting token decimals is using `getMint` from `@solana/spl-token`:

```typescript
import { getMint } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'

async function getTokenDecimals(tokenAddress: string): Promise<number> {
  const connection = new Connection(RPC_URL, { commitment: "confirmed" })
  const mintPublicKey = new PublicKey(tokenAddress)
  const mintInfo = await getMint(connection, mintPublicKey)
  return mintInfo.decimals
}
```

**Why `getMint` is the best approach:**
- ✅ **Direct on-chain data**: Gets decimals directly from the token's mint account
- ✅ **Always accurate**: No reliance on external APIs or cached data
- ✅ **Fast**: Single RPC call to get mint info
- ✅ **Reliable**: Works for any valid SPL token, even if not listed elsewhere
- ✅ **Standard approach**: This is the official Solana way to get token metadata

## Architecture

### Data Sources (in order of preference)

1. **On-chain Validation** (via `@solana/spl-token` - **RECOMMENDED**)
   - Uses `getMint` to get decimals directly from blockchain
   - Most reliable and accurate method
   - Works for any valid SPL token

2. **Jupiter API** (`https://token.jup.ag/all`)
   - Most comprehensive token list
   - Includes verified and unverified tokens
   - Rich metadata (logos, websites, social links)
   - Real-time updates

3. **Solana Token List** (`https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json`)
   - Official Solana token list
   - Curated and verified tokens
   - Fallback when Jupiter is unavailable

## API Endpoints

### Search Tokens

```typescript
// GET /api/token/search
GET /api/token/search?q=sol&includeUnverified=true&maxResults=10

// POST /api/token/search
POST /api/token/search
{
  "query": "bonk",
  "options": {
    "includeUnverified": false,
    "maxResults": 5,
    "network": "mainnet"
  }
}
```

### Get Token by Symbol

```typescript
GET /api/token/search?symbol=SOL
```

## Core Services

### Token Lookup Service (`lib/services/token-lookup-service.ts`)

Main service for token discovery and validation:

```typescript
import { 
  searchTokensBySymbolOrName,
  getTokenAddressFromSymbol,
  getTokenInfoFromSymbol,
  validateTokenAddress,
  getTokenDecimalsFromMint  // ⭐ NEW: Direct mint access
} from '@/lib/services/token-lookup-service'

// Search tokens
const results = await searchTokensBySymbolOrName('sol', {
  includeUnverified: false,
  maxResults: 10,
  network: 'mainnet'
})

// Get token address
const address = await getTokenAddressFromSymbol('SOL')

// Get token info
const tokenInfo = await getTokenInfoFromSymbol('BONK')

// Get decimals directly from mint (RECOMMENDED)
const decimals = await getTokenDecimalsFromMint(tokenAddress)

// Validate address
const isValid = await validateTokenAddress(tokenAddress)
```

### Updated Token Utils (`lib/utils/token-utils.ts`)

Enhanced with dynamic functionality and `getMint` support:

```typescript
import { 
  getTokenDecimals,
  getTokenDecimalsDirect,  // ⭐ NEW: Direct mint access
  getTokenMintInfo,        // ⭐ NEW: Full mint info
  convertToSmallestUnit,
  convertFromSmallestUnit,
  getTokenAddressFromSymbol,
  searchTokens
} from '@/lib/utils/token-utils'

// Get decimals directly from mint (MOST RELIABLE)
const decimals = await getTokenDecimalsDirect(tokenAddress)

// Get full mint information
const mintInfo = await getTokenMintInfo(tokenAddress)
console.log('Decimals:', mintInfo.decimals)
console.log('Supply:', mintInfo.supply)
console.log('Mint Authority:', mintInfo.mintAuthority)

// Dynamic decimals lookup (with fallbacks)
const decimals = await getTokenDecimals(tokenAddress)

// Convert amounts with dynamic decimals
const smallestUnit = await convertToSmallestUnit(0.5, tokenAddress)
const humanAmount = await convertFromSmallestUnit(smallestUnit, tokenAddress)

// Search tokens
const tokens = await searchTokens('bonk', { maxResults: 5 })
```

## React Hooks

### useTokenLookup

Main hook for token search functionality:

```typescript
import { useTokenLookup } from '@/hooks/use-token-lookup'

function TokenSearchComponent() {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchError,
    getTokenAddress,
    getTokenInfo,
    clearSearch
  } = useTokenLookup({
    includeUnverified: false,
    maxResults: 10,
    debounceMs: 300
  })

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tokens..."
      />
      {isSearching && <div>Loading...</div>}
      {searchResults.map(token => (
        <div key={token.address}>
          {token.symbol} - {token.name}
        </div>
      ))}
    </div>
  )
}
```

### useTokenAddress

Simplified hook for getting token address:

```typescript
import { useTokenAddress } from '@/hooks/use-token-lookup'

function TokenAddressComponent() {
  const { address, isLoading, error } = useTokenAddress('SOL')
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (address) return <div>Address: {address}</div>
  
  return null
}
```

### useTokenInfo

Simplified hook for getting token info:

```typescript
import { useTokenInfo } from '@/hooks/use-token-lookup'

function TokenInfoComponent() {
  const { tokenInfo, isLoading, error } = useTokenInfo('BONK')
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (tokenInfo) {
    return (
      <div>
        <h3>{tokenInfo.symbol}</h3>
        <p>{tokenInfo.name}</p>
        <p>Decimals: {tokenInfo.decimals}</p>
        <p>Verified: {tokenInfo.verified ? 'Yes' : 'No'}</p>
      </div>
    )
  }
  
  return null
}
```

## React Components

### TokenSearch

Full-featured token search component:

```typescript
import { TokenSearch } from '@/components/token-search'

function MyComponent() {
  const handleTokenSelect = (token) => {
    console.log('Selected token:', token)
  }

  return (
    <TokenSearch
      onTokenSelect={handleTokenSelect}
      includeUnverified={true}
      maxResults={10}
      showAdvancedOptions={true}
      placeholder="Search tokens by symbol or name..."
    />
  )
}
```

### TokenSearchInput

Simple dropdown search input:

```typescript
import { TokenSearchInput } from '@/components/token-search'

function MyComponent() {
  const handleTokenSelect = (token) => {
    console.log('Selected token:', token)
  }

  return (
    <TokenSearchInput
      onTokenSelect={handleTokenSelect}
      placeholder="Search tokens..."
    />
  )
}
```

## Caching

The system implements intelligent caching to improve performance:

- **Token Lookup Cache**: 5-minute cache for search results
- **Token Decimals Cache**: 10-minute cache for token decimals
- **Automatic Cache Invalidation**: Based on time and network changes

### Cache Management

```typescript
import { 
  clearTokenLookupCache,
  getTokenLookupCacheStats
} from '@/lib/services/token-lookup-service'

// Clear all caches
clearTokenLookupCache()

// Get cache statistics
const stats = getTokenLookupCacheStats()
console.log(`Cache size: ${stats.size}`)
console.log(`Cache entries: ${stats.entries.join(', ')}`)
```

## Migration Guide

### From Static Mappings

**Before:**
```typescript
const TOKEN_DECIMALS = {
  'So11111111111111111111111111111111111111112': 9, // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6, // USDC
}

function convertToSmallestUnit(amount, tokenAddress) {
  const decimals = TOKEN_DECIMALS[tokenAddress] || 9
  return Math.floor(amount * Math.pow(10, decimals)).toString()
}
```

**After (Recommended - Direct Mint Access):**
```typescript
import { getTokenDecimalsDirect, convertToSmallestUnit } from '@/lib/utils/token-utils'

// Get decimals directly from mint (MOST RELIABLE)
const decimals = await getTokenDecimalsDirect(tokenAddress)

// Convert amounts with dynamic decimals
const smallestUnit = await convertToSmallestUnit(amount, tokenAddress)
```

**After (With Fallbacks):**
```typescript
import { convertToSmallestUnit, getTokenDecimals } from '@/lib/utils/token-utils'

// Async version with fallbacks
const smallestUnit = await convertToSmallestUnit(amount, tokenAddress)

// Or get decimals separately
const decimals = await getTokenDecimals(tokenAddress)
```

### Backward Compatibility

Legacy synchronous functions are still available but deprecated:

```typescript
import { 
  convertToSmallestUnitSync,
  convertFromSmallestUnitSync
} from '@/lib/utils/token-utils'

// These still work but use static mappings
const smallestUnit = convertToSmallestUnitSync(amount, tokenAddress)
const humanAmount = convertFromSmallestUnitSync(smallestUnit, tokenAddress)
```

## Error Handling

The system includes comprehensive error handling:

```typescript
try {
  const address = await getTokenAddressFromSymbol('INVALID_SYMBOL')
  if (!address) {
    console.log('Token not found')
  }
} catch (error) {
  console.error('Search failed:', error.message)
}
```

## Performance Considerations

1. **Debouncing**: Search inputs are debounced to avoid excessive API calls
2. **Caching**: Results are cached to reduce API requests
3. **Fallbacks**: Multiple data sources ensure availability
4. **Lazy Loading**: Token info is loaded only when needed
5. **Direct Mint Access**: `getMint` provides the fastest and most reliable decimals lookup

## Best Practices

1. **Use `getMint` for decimals**: Prefer `getTokenDecimalsDirect()` for the most reliable decimals lookup
2. **Use async functions**: Prefer the new async versions over sync ones
3. **Handle loading states**: Always show loading indicators during searches
4. **Cache results**: Reuse token info when possible
5. **Validate addresses**: Always validate token addresses before use
6. **Error boundaries**: Wrap token lookup components in error boundaries

## Demo

Visit `/token-search-demo` to see the system in action with interactive examples, including the new direct mint info lookup.

## Examples

### Node.js Example

See `examples/get-token-decimals.js` for a complete Node.js example using `getMint`.

### Quick Start

```typescript
// Get decimals directly from mint (RECOMMENDED)
import { getTokenDecimalsDirect } from '@/lib/utils/token-utils'

const decimals = await getTokenDecimalsDirect('So11111111111111111111111111111111111111112')
console.log('SOL decimals:', decimals) // 9

// Get full mint info
import { getTokenMintInfo } from '@/lib/utils/token-utils'

const mintInfo = await getTokenMintInfo('So11111111111111111111111111111111111111112')
console.log('Mint info:', mintInfo)
// {
//   decimals: 9,
//   supply: "533000000000000000",
//   isInitialized: true,
//   freezeAuthority: null,
//   mintAuthority: null
// }
```

## Troubleshooting

### Common Issues

1. **Token not found**: Check if the symbol is correct and try including unverified tokens
2. **API errors**: Check network connectivity and API rate limits
3. **Cache issues**: Clear the cache if you're getting stale data
4. **Performance**: Reduce maxResults or increase debounce time for better performance
5. **RPC errors**: Ensure your RPC endpoint is working correctly

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG_TOKEN_LOOKUP=true
```

This will log detailed information about API calls, cache hits, and errors. 