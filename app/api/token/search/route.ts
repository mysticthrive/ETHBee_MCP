import { NextRequest, NextResponse } from 'next/server'
import { searchTokensBySymbolOrName, getTokenAddressFromSymbol, getTokenInfoFromSymbol, TokenSearchOptions } from '@/lib/services/token-lookup-service'
import { logError } from '@/lib/utils/error-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const symbol = searchParams.get('symbol')
    const includeUnverified = searchParams.get('includeUnverified') === 'true'
    const maxResults = parseInt(searchParams.get('maxResults') || '10')
    const network = searchParams.get('network') as 'mainnet' | 'devnet' | 'testnet' || 'mainnet'

    if (!query && !symbol) {
      return NextResponse.json(
        { error: 'Query parameter "q" or "symbol" is required' },
        { status: 400 }
      )
    }

    const searchQuery = query || symbol || ''
    const options: TokenSearchOptions = {
      includeUnverified,
      maxResults,
      network
    }

    console.log(`API: Searching tokens for query: "${searchQuery}"`, options)

    let results

    if (symbol) {
      // If searching by symbol, get the most specific result
      const tokenInfo = await getTokenInfoFromSymbol(searchQuery, options)
      results = tokenInfo ? [tokenInfo] : []
    } else {
      // If searching by query, get multiple results
      results = await searchTokensBySymbolOrName(searchQuery, options)
    }

    return NextResponse.json({
      success: true,
      data: {
        query: searchQuery,
        results,
        count: results.length,
        options
      }
    })
  } catch (error) {
    logError(error, 'token/search', { url: request.url })
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, symbol, options = {} } = body

    if (!query && !symbol) {
      return NextResponse.json(
        { error: 'Query or symbol is required in request body' },
        { status: 400 }
      )
    }

    const searchQuery = query || symbol || ''
    const searchOptions: TokenSearchOptions = {
      includeUnverified: options.includeUnverified || false,
      maxResults: options.maxResults || 10,
      network: options.network || 'mainnet'
    }

    console.log(`API: Searching tokens for query: "${searchQuery}"`, searchOptions)

    let results

    if (symbol) {
      // If searching by symbol, get the most specific result
      const tokenInfo = await getTokenInfoFromSymbol(searchQuery, searchOptions)
      results = tokenInfo ? [tokenInfo] : []
    } else {
      // If searching by query, get multiple results
      results = await searchTokensBySymbolOrName(searchQuery, searchOptions)
    }

    return NextResponse.json({
      success: true,
      data: {
        query: searchQuery,
        results,
        count: results.length,
        options: searchOptions
      }
    })
  } catch (error) {
    logError(error, 'token/search', { body: await request.text() })
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 