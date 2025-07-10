/**
 * Wallet service for retrieving wallet information from Solana blockchain
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getTokenPrice } from './price-service'

// Types for wallet data
export interface TokenBalance {
  mint: string
  symbol: string
  name: string
  balance: number
  decimals: number
  uiAmount: number
  valueUsd?: number
}

export interface WalletBalance {
  solBalance: number
  solValueUsd: number
  totalValueUsd: number
  tokens: TokenBalance[]
}

export interface Transaction {
  signature: string
  blockTime: number
  type: string
  amount?: number
  tokenSymbol?: string
  status: 'success' | 'failed'
  fee: number
}

export interface WalletPortfolio {
  totalValue: number
  solValue: number
  tokenValue: number
  holdings: TokenBalance[]
  performance?: {
    dayChange: number
    dayChangePercent: number
    weekChange: number
    weekChangePercent: number
  }
}

export interface WalletInfo {
  address: string
  isActive: boolean
  firstTransactionDate?: Date
  totalTransactions: number
  totalVolume: number
}

export interface NFT {
  mint: string
  name: string
  symbol: string
  image?: string
  collection?: string
  attributes?: Array<{ trait_type: string; value: string }>
}

// Solana RPC connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
)

// Real token prices are now fetched from CoinGecko via price-service

// Mock token metadata
const TOKEN_METADATA: Record<string, { name: string; symbol: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112': { name: 'Solana', symbol: 'SOL', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { name: 'USD Coin', symbol: 'USDC', decimals: 6 },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { name: 'Bonk', symbol: 'BONK', decimals: 5 },
}

/**
 * Get wallet balance including SOL and token balances
 */
export async function getWalletBalance(
  walletAddress: string,
  includeTokens: boolean = true
): Promise<WalletBalance> {
  try {
    const publicKey = new PublicKey(walletAddress)

    // Get SOL balance
    const solBalance = await connection.getBalance(publicKey)
    const solAmount = solBalance / LAMPORTS_PER_SOL
    const solPrice = await getTokenPrice('SOL')
    const solValueUsd = solAmount * solPrice

    let tokens: TokenBalance[] = []
    let totalValueUsd = solValueUsd

    if (includeTokens) {
      // Get token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      })

      // Get token accounts and calculate values with real prices
      const tokenAccountsData = tokenAccounts.value
        .filter(account => {
          const amount = account.account.data.parsed.info.tokenAmount.uiAmount
          return amount && amount > 0
        })

      // Get unique token symbols for price fetching
      const tokenSymbols = new Set<string>()
      tokenAccountsData.forEach(account => {
        const mint = account.account.data.parsed.info.mint
        const metadata = TOKEN_METADATA[mint]
        if (metadata) {
          tokenSymbols.add(metadata.symbol)
        }
      })

      // Fetch prices for all tokens at once
      const tokenPrices: Record<string, number> = {}
      for (const symbol of tokenSymbols) {
        try {
          tokenPrices[symbol] = await getTokenPrice(symbol)
        } catch (error) {
          console.warn(`Failed to get price for ${symbol}:`, error)
          tokenPrices[symbol] = 0
        }
      }

      tokens = tokenAccountsData.map(account => {
        const info = account.account.data.parsed.info
        const mint = info.mint
        const metadata = TOKEN_METADATA[mint] || { name: 'Unknown', symbol: 'UNK', decimals: 9 }
        const balance = info.tokenAmount.amount
        const decimals = info.tokenAmount.decimals
        const uiAmount = info.tokenAmount.uiAmount
        const tokenPrice = tokenPrices[metadata.symbol] || 0
        const valueUsd = uiAmount * tokenPrice

        totalValueUsd += valueUsd

        return {
          mint,
          symbol: metadata.symbol,
          name: metadata.name,
          balance: parseInt(balance),
          decimals,
          uiAmount,
          valueUsd
        }
      })
    }

    return {
      solBalance: solAmount,
      solValueUsd,
      totalValueUsd,
      tokens
    }
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    throw new Error('Failed to fetch wallet balance')
  }
}

/**
 * Get wallet portfolio with performance data
 */
export async function getWalletPortfolio(
  walletAddress: string,
  includePerformance: boolean = false
): Promise<WalletPortfolio> {
  try {
    const balance = await getWalletBalance(walletAddress, true)

    const portfolio: WalletPortfolio = {
      totalValue: balance.totalValueUsd,
      solValue: balance.solValueUsd,
      tokenValue: balance.totalValueUsd - balance.solValueUsd,
      holdings: balance.tokens
    }

    if (includePerformance) {
      // Note: Real performance calculation would require historical price data
      // For now, we indicate that performance data is not available
      portfolio.performance = {
        dayChange: 0,
        dayChangePercent: 0,
        weekChange: 0,
        weekChangePercent: 0
      }
    }

    return portfolio
  } catch (error) {
    console.error('Error fetching wallet portfolio:', error)
    throw new Error('Failed to fetch wallet portfolio')
  }
}

/**
 * Get wallet transaction history
 */
export async function getWalletTransactions(
  walletAddress: string,
  limit: number = 50,
  transactionType?: string,
  tokenSymbol?: string
): Promise<Transaction[]> {
  try {
    const publicKey = new PublicKey(walletAddress)

    // Get transaction signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit })

    // Parse actual transaction data
    const transactions: Transaction[] = []

    for (const sig of signatures) {
      try {
        // Get the actual transaction details
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })

        if (tx) {
          // Calculate actual fee
          const fee = tx.meta?.fee || 0

          // Determine transaction type based on transaction data
          let type = 'transfer'
          let amount = 0
          let tokenSymbol = 'SOL'

          // Check for SOL transfers
          if (tx.meta?.preBalances && tx.meta?.postBalances) {
            const balanceChange = tx.meta.postBalances[0] - tx.meta.preBalances[0]
            if (balanceChange !== 0) {
              amount = Math.abs(balanceChange) / LAMPORTS_PER_SOL
              type = balanceChange > 0 ? 'receive' : 'send'
              tokenSymbol = 'SOL'
            }
          }

          // Check for token transfers in the transaction
          if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
            for (let i = 0; i < tx.meta.postTokenBalances.length; i++) {
              const postBalance = tx.meta.postTokenBalances[i]
              const preBalance = tx.meta.preTokenBalances.find(b => b.accountIndex === postBalance.accountIndex)

              if (preBalance && postBalance.uiTokenAmount.uiAmount && preBalance.uiTokenAmount.uiAmount) {
                const tokenChange = postBalance.uiTokenAmount.uiAmount - preBalance.uiTokenAmount.uiAmount
                if (Math.abs(tokenChange) > 0) {
                  amount = Math.abs(tokenChange)
                  type = tokenChange > 0 ? 'receive' : 'send'

                  // Try to get token symbol from metadata
                  const mint = postBalance.mint
                  const metadata = TOKEN_METADATA[mint]
                  tokenSymbol = metadata?.symbol || 'UNKNOWN'
                  break
                }
              }
            }
          }

          transactions.push({
            signature: sig.signature,
            blockTime: sig.blockTime || Date.now() / 1000,
            type,
            amount,
            tokenSymbol,
            status: sig.err ? 'failed' : 'success',
            fee: fee / LAMPORTS_PER_SOL
          })
        }
      } catch (txError) {
        console.warn(`Failed to parse transaction ${sig.signature}:`, txError)
        // Add basic transaction info even if parsing fails
        transactions.push({
          signature: sig.signature,
          blockTime: sig.blockTime || Date.now() / 1000,
          type: 'unknown',
          status: sig.err ? 'failed' : 'success',
          fee: 0
        })
      }
    }

    // Apply filters
    let filteredTransactions = transactions

    if (transactionType && transactionType !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === transactionType)
    }

    if (tokenSymbol) {
      filteredTransactions = filteredTransactions.filter(tx => tx.tokenSymbol === tokenSymbol)
    }

    return filteredTransactions.slice(0, limit)
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    throw new Error('Failed to fetch wallet transactions')
  }
}

/**
 * Get general wallet information
 */
export async function getWalletInfo(walletAddress: string): Promise<WalletInfo> {
  try {
    const publicKey = new PublicKey(walletAddress)

    // Get account info to check if wallet is active
    const accountInfo = await connection.getAccountInfo(publicKey)
    const isActive = accountInfo !== null

    // Get transaction signatures to determine first transaction and total count
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 1000 })

    const totalTransactions = signatures.length
    const firstTransactionDate = signatures.length > 0
      ? new Date((signatures[signatures.length - 1].blockTime || 0) * 1000)
      : undefined

    // Calculate real total volume from transactions
    let totalVolume = 0

    // Sample a subset of transactions to calculate volume (to avoid rate limits)
    const sampleSize = Math.min(50, signatures.length)
    const sampleSignatures = signatures.slice(0, sampleSize)

    for (const sig of sampleSignatures) {
      try {
        const tx = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        })

        if (tx?.meta) {
          // Add SOL volume from balance changes
          if (tx.meta.preBalances && tx.meta.postBalances) {
            const balanceChange = Math.abs(tx.meta.postBalances[0] - tx.meta.preBalances[0])
            const solAmount = balanceChange / LAMPORTS_PER_SOL
            const solPrice = await getTokenPrice('SOL')
            totalVolume += solAmount * solPrice
          }

          // Add token volume from token balance changes
          if (tx.meta.preTokenBalances && tx.meta.postTokenBalances) {
            for (const postBalance of tx.meta.postTokenBalances) {
              const preBalance = tx.meta.preTokenBalances.find(b => b.accountIndex === postBalance.accountIndex)
              if (preBalance && postBalance.uiTokenAmount.uiAmount && preBalance.uiTokenAmount.uiAmount) {
                const tokenChange = Math.abs(postBalance.uiTokenAmount.uiAmount - preBalance.uiTokenAmount.uiAmount)
                const metadata = TOKEN_METADATA[postBalance.mint]
                if (metadata) {
                  try {
                    const tokenPrice = await getTokenPrice(metadata.symbol)
                    totalVolume += tokenChange * tokenPrice
                  } catch (error) {
                    console.warn(`Failed to get price for ${metadata.symbol} in volume calculation`)
                  }
                }
              }
            }
          }
        }
      } catch (txError) {
        // Skip transactions that can't be parsed
        console.warn(`Failed to parse transaction for volume calculation: ${sig.signature}`)
      }
    }

    // If we sampled transactions, extrapolate the total volume
    if (sampleSize < signatures.length && sampleSize > 0) {
      totalVolume = (totalVolume / sampleSize) * signatures.length
    }

    return {
      address: walletAddress,
      isActive,
      firstTransactionDate,
      totalTransactions,
      totalVolume
    }
  } catch (error) {
    console.error('Error fetching wallet info:', error)
    throw new Error('Failed to fetch wallet info')
  }
}

/**
 * Get wallet NFTs
 */
export async function getWalletNFTs(
  _walletAddress: string,
  _collection?: string
): Promise<NFT[]> {
  try {
    // Note: Real NFT fetching would require Metaplex or similar NFT indexing service
    // For now, return empty array as we don't have access to NFT metadata services
    console.log('NFT fetching not implemented - would require Metaplex or NFT indexing service')
    return []
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error)
    throw new Error('Failed to fetch wallet NFTs')
  }
}
