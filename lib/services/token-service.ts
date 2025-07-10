import { Connection, PublicKey } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Metaplex } from "@metaplex-foundation/js"
import { RPC_CONFIG } from "@/lib/config/rpc-config"
import { logError } from "@/lib/utils/error-utils"

// Create a connection to the Solana cluster with better error handling
const getConnection = () => {
  try {
    const rpcUrl = RPC_CONFIG.getBestRpcUrl()
    console.log(`Using RPC URL: ${rpcUrl}`)
    return new Connection(rpcUrl, "confirmed")
  } catch (error) {
    console.error("Error creating Solana connection:", error)
    // Fallback to a default RPC if the config fails
    return new Connection("https://api.mainnet-beta.solana.com", "confirmed")
  }
}

// Create a Metaplex instance
const getMetaplex = () => {
  return new Metaplex(getConnection())
}

export interface TokenInfo {
  address: string
  mint?: PublicKey
  symbol: string
  name: string
  decimals?: number
  supply?: number
  logoUrl?: string
  isValid: boolean
  metadata?: any
}

export interface TokenPrice {
  usd: number
  usd_24h_change?: number
  last_updated_at: number
}

export interface TokenMarketData {
  marketCap?: number
  volume24h?: number
  high24h?: number
  low24h?: number
  allTimeHigh?: number
  allTimeHighDate?: string
  circulatingSupply?: number
  totalSupply?: number
  fullyDilutedValuation?: number
  rank?: number
}

export interface TokenValidationResult {
  valid: boolean
  token?: TokenInfo
  price?: TokenPrice
  marketData?: TokenMarketData
  error?: string
  details?: string
}

export interface TokenHolder {
  owner: string
  amount: number
  decimals?: number
}

export interface TokenHoldersResult {
  holders: TokenHolder[]
  totalUniqueHolders: number
}

/**
 * Validates a Solana token address and returns token information
 */
export async function validateToken(tokenAddress: string): Promise<TokenValidationResult> {
  try {
    console.log(`Starting token validation for (original case): ${tokenAddress}`)

    // Check if the address is empty or too short
    if (!tokenAddress || tokenAddress.length < 32) {
      return {
        valid: false,
        error: "Invalid token address",
        details: `The provided address "${tokenAddress}" is too short. Solana addresses should be 32-44 characters long.`,
      }
    }

    // Create a PublicKey from the token address
    let pubkey: PublicKey
    try {
      pubkey = new PublicKey(tokenAddress)
      console.log(`Successfully created PublicKey from address: ${tokenAddress}`)
      console.log(`PublicKey toString(): ${pubkey.toString()}`) // Check if PublicKey changes the case
    } catch (error) {
      logError(error, "validateToken - Invalid public key", { tokenAddress })
      return {
        valid: false,
        error: "Invalid token address format",
        details: `The address "${tokenAddress}" is not a valid Solana address format. Solana addresses should be base58-encoded and 32-44 characters long.`,
      }
    }

    // Get connection with retry mechanism
    let connection: Connection | null = null
    let connectionAttempts = 0
    const maxConnectionAttempts = 3

    while (!connection && connectionAttempts < maxConnectionAttempts) {
      try {
        connectionAttempts++
        console.log(`Connection attempt ${connectionAttempts}/${maxConnectionAttempts}`)
        connection = getConnection()
      } catch (error) {
        console.error(`Connection attempt ${connectionAttempts} failed:`, error)
        if (connectionAttempts >= maxConnectionAttempts) {
          return {
            valid: false,
            error: "Failed to connect to Solana network",
            details: `Could not establish a connection to the Solana network after ${maxConnectionAttempts} attempts. Please try again later.`,
          }
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!connection) {
      return {
        valid: false,
        error: "Failed to connect to Solana network",
        details: "Could not establish a connection to the Solana network. Please try again later.",
      }
    }

    // Try to get the token account info with retry mechanism
    let tokenInfo = null
    let accountAttempts = 0
    const maxAccountAttempts = 3

    while (tokenInfo === null && accountAttempts < maxAccountAttempts) {
      try {
        accountAttempts++
        console.log(`Account info attempt ${accountAttempts}/${maxAccountAttempts}`)
        tokenInfo = await connection.getAccountInfo(pubkey)
        console.log(`Token account info retrieved: ${tokenInfo ? "Success" : "Not found"}`)
        if (tokenInfo) {
          console.log(`Account owner: ${tokenInfo.owner.toString()}`)
          console.log(`Expected token program ID: ${TOKEN_PROGRAM_ID.toString()}`)
        }
      } catch (error) {
        console.error(`Account info attempt ${accountAttempts} failed:`, error)
        if (accountAttempts >= maxAccountAttempts) {
          logError(error, "validateToken - Error getting account info after max attempts", { tokenAddress })
          return {
            valid: false,
            error: "Error retrieving account information",
            details: `Failed to retrieve account information from the Solana blockchain after ${maxAccountAttempts} attempts. This could be due to RPC connection issues. Error: ${error instanceof Error ? error.message : String(error)}`,
          }
        }
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    // If the account doesn't exist, it's not a valid token
    if (!tokenInfo) {
      const invalidToken: TokenInfo = {
        address: tokenAddress,
        symbol: "UNKNOWN",
        name: "Unknown Token",
        isValid: false,
      }

      return {
        valid: false,
        token: invalidToken,
        error: "Token account not found",
        details: `No account was found at address ${tokenAddress}. The token might not exist or the address might be incorrect.`,
      }
    }

    // Check if it's owned by the Token Program
    const isTokenProgram = tokenInfo.owner.equals(TOKEN_PROGRAM_ID)
    console.log(`Is token program owned: ${isTokenProgram}`)

    // If it's not owned by the Token Program, try to validate using Jupiter API as a fallback
    if (!isTokenProgram) {
      console.log("Account is not owned by Token Program, trying Jupiter API as fallback")
      const jupiterResult = await validateTokenWithJupiter(tokenAddress)
      if (jupiterResult.valid) {
        return jupiterResult
      }

      // If Jupiter validation also fails, return the original error
      const invalidToken: TokenInfo = {
        address: tokenAddress,
        symbol: "UNKNOWN",
        name: "Unknown Token",
        isValid: false,
      }

      return {
        valid: false,
        token: invalidToken,
        error: "Not a valid SPL token",
        details: `The account at address ${tokenAddress} exists but is not an SPL token. It is owned by ${tokenInfo.owner.toString()} instead of the SPL Token Program (${TOKEN_PROGRAM_ID.toString()}).`,
      }
    }

    // It's a valid token, get more information
    const tokenMetadata: TokenInfo = {
      address: tokenAddress,
      mint: pubkey,
      symbol: tokenAddress.substring(0, 4).toUpperCase(),
      name: "Unknown Token",
      isValid: true,
    }

    try {
      // Get token supply and decimals
      const supplyInfo = await connection.getTokenSupply(pubkey)
      tokenMetadata.supply = supplyInfo.value.uiAmount
      tokenMetadata.decimals = supplyInfo.value.decimals
      console.log(`Token supply info retrieved: ${JSON.stringify(supplyInfo.value)}`)
    } catch (error) {
      logError(error, "validateToken - Error getting token supply", { tokenAddress })
      console.log("Continuing validation despite supply info error")
      // Continue even if we can't get supply info
    }

    // Try to get token data from Jupiter API
    let jupiterSuccess = false
    try {
      console.log("Attempting to fetch token data from Jupiter API")
      const jupiterUrl = `https://lite-api.jup.ag/tokens/v1/token/${tokenAddress}`

      const jupiterResponse = await fetch(jupiterUrl)

      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json()
        console.log("Jupiter API response:", JSON.stringify(jupiterData).substring(0, 200) + "...")

        if (jupiterData) {
          jupiterSuccess = true

          // Update token metadata with Jupiter data
          tokenMetadata.name = jupiterData.name || tokenMetadata.name
          tokenMetadata.symbol = jupiterData.symbol || tokenMetadata.symbol
          tokenMetadata.decimals = jupiterData.decimals || tokenMetadata.decimals
          tokenMetadata.logoUrl = jupiterData.logoURI || tokenMetadata.logoUrl

          // If we have a coingeckoId in the extensions, store it for later use
          if (jupiterData.extensions && jupiterData.extensions.coingeckoId) {
            tokenMetadata.metadata = {
              ...tokenMetadata.metadata,
              coingeckoId: jupiterData.extensions.coingeckoId,
            }
          }

          // Store additional Jupiter data
          tokenMetadata.metadata = {
            ...tokenMetadata.metadata,
            jupiter: jupiterData,
          }
        }
      } else {
        console.log(`Jupiter API returned status ${jupiterResponse.status}`)
      }
    } catch (error) {
      logError(error, "validateToken - Error getting Jupiter data", { tokenAddress })
      // Continue even if we can't get Jupiter data
    }

    // Try to get Helius enhanced token metadata if available
    let heliusSuccess = false
    if (RPC_CONFIG.premium.helius) {
      try {
        console.log("Attempting to fetch token data from Helius API using getAsset")
        const heliusUrl = RPC_CONFIG.premium.helius

        // Use the getAsset method from the Digital Asset Standard (DAS) API
        const dasPayload = {
          jsonrpc: "2.0",
          id: "helius-das",
          method: "getAsset",
          params: {
            id: tokenAddress,
          },
        }

        console.log("Sending getAsset request to Helius:", JSON.stringify(dasPayload))

        const dasResponse = await fetch(heliusUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dasPayload),
        })

        console.log("Helius getAsset response status:", dasResponse.status)

        if (dasResponse.ok) {
          const data = await dasResponse.json()
          console.log("Helius getAsset response:", JSON.stringify(data).substring(0, 200) + "...")

          if (data.result) {
            const asset = data.result
            heliusSuccess = true

            // Update token metadata with Helius data
            if (asset.content?.metadata?.name) {
              tokenMetadata.name = asset.content.metadata.name
            }

            if (asset.content?.metadata?.symbol) {
              tokenMetadata.symbol = asset.content.metadata.symbol
            }

            if (asset.content?.files?.[0]?.uri) {
              tokenMetadata.logoUrl = asset.content.files[0].uri
            } else if (asset.content?.metadata?.image) {
              tokenMetadata.logoUrl = asset.content.metadata.image
            }

            // Get supply information if available
            if (asset.token_info) {
              tokenMetadata.supply = asset.token_info.supply
              tokenMetadata.decimals = asset.token_info.decimals
            }

            // Store full metadata for reference
            tokenMetadata.metadata = {
              ...tokenMetadata.metadata,
              helius: asset,
            }
          }
        } else {
          const errorText = await dasResponse.text()
          console.error("Helius getAsset API error:", errorText)
        }
      } catch (error) {
        logError(error, "validateToken - Error getting Helius metadata", { tokenAddress })
        console.error("Detailed Helius API error:", error)
        // Continue even if we can't get Helius metadata
      }
    }

    // Fallback to Metaplex if neither Jupiter nor Helius provided metadata
    if (!jupiterSuccess && !heliusSuccess) {
      console.log("Falling back to Metaplex for token metadata")
      try {
        // Try to get Metaplex metadata
        const metaplex = getMetaplex()
        const nft = await metaplex.nfts().findByMint({ mintAddress: pubkey })

        if (nft) {
          tokenMetadata.name = nft.name || tokenMetadata.name
          tokenMetadata.symbol = nft.symbol || tokenMetadata.symbol
          tokenMetadata.metadata = {
            ...tokenMetadata.metadata,
            metaplex: nft.json,
          }

          // Get logo URL if available
          if (nft.json?.image) {
            tokenMetadata.logoUrl = nft.json.image
          }
        }
      } catch (error) {
        logError(error, "validateToken - Error getting Metaplex metadata", { tokenAddress })
        // Continue even if we can't get Metaplex metadata
      }
    }

    // Get price data
    const price = await getTokenPrice(tokenAddress, tokenMetadata.symbol)

    // Get market data
    const marketData = await getTokenMarketData(tokenAddress, tokenMetadata.symbol)

    return {
      valid: true,
      token: tokenMetadata,
      price,
      marketData,
    }
  } catch (error) {
    logError(error, "validateToken", { tokenAddress })
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error validating token",
      details: `An unexpected error occurred during token validation: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Validates a token using Jupiter API as a fallback method
 */
async function validateTokenWithJupiter(tokenAddress: string): Promise<TokenValidationResult> {
  try {
    console.log("Attempting to validate token using Jupiter API")
    const jupiterUrl = `https://lite-api.jup.ag/tokens/v1/token/${tokenAddress}`

    const jupiterResponse = await fetch(jupiterUrl)

    if (jupiterResponse.ok) {
      const jupiterData = await jupiterResponse.json()
      console.log("Jupiter API validation response:", JSON.stringify(jupiterData).substring(0, 200) + "...")

      if (jupiterData && jupiterData.address === tokenAddress) {
        // It's a valid token according to Jupiter
        const tokenMetadata: TokenInfo = {
          address: tokenAddress,
          symbol: jupiterData.symbol || tokenAddress.substring(0, 4).toUpperCase(),
          name: jupiterData.name || "Unknown Token",
          decimals: jupiterData.decimals,
          logoUrl: jupiterData.logoURI,
          isValid: true,
          metadata: {
            jupiter: jupiterData,
          },
        }

        // Get price data if coingeckoId is available
        let price: TokenPrice | undefined
        if (jupiterData.extensions?.coingeckoId) {
          try {
            const cgResponse = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${jupiterData.extensions.coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
            )

            if (cgResponse.ok) {
              const cgData = await cgResponse.json()
              if (cgData[jupiterData.extensions.coingeckoId]) {
                price = {
                  usd: cgData[jupiterData.extensions.coingeckoId].usd,
                  usd_24h_change: cgData[jupiterData.extensions.coingeckoId].usd_24h_change,
                  last_updated_at: cgData[jupiterData.extensions.coingeckoId].last_updated_at,
                }
              }
            }
          } catch (error) {
            console.error("Error fetching price from CoinGecko:", error)
          }
        }

        return {
          valid: true,
          token: tokenMetadata,
          price,
        }
      }
    }

    // If we get here, Jupiter validation failed
    return {
      valid: false,
      error: "Token not found in Jupiter API",
      details: `The token address ${tokenAddress} was not found in the Jupiter API.`,
    }
  } catch (error) {
    logError(error, "validateTokenWithJupiter", { tokenAddress })
    return {
      valid: false,
      error: "Error validating with Jupiter",
      details: `Failed to validate token with Jupiter API: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Gets the current price of a token
 */
export async function getTokenPrice(tokenAddress: string, symbol?: string): Promise<TokenPrice | undefined> {
  try {
    // Try to get the coingeckoId from Jupiter API first
    let coingeckoId: string | undefined
    try {
      console.log("Attempting to fetch token data from Jupiter API to get coingeckoId")
      const jupiterUrl = `https://lite-api.jup.ag/tokens/v1/token/${tokenAddress}`

      const jupiterResponse = await fetch(jupiterUrl)

      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json()
        console.log("Jupiter API response:", JSON.stringify(jupiterData).substring(0, 200) + "...")

        if (jupiterData && jupiterData.extensions && jupiterData.extensions.coingeckoId) {
          coingeckoId = jupiterData.extensions.coingeckoId
          console.log(`Found coingeckoId in Jupiter data: ${coingeckoId}`)
        }
      } else {
        console.log(`Jupiter API returned status ${jupiterResponse.status}`)
      }
    } catch (error) {
      logError(error, "getTokenPrice - Error fetching from Jupiter", { tokenAddress, symbol })
      // Continue to other methods if Jupiter fails
    }

    // If we have a coingeckoId, use it to get price from CoinGecko
    if (coingeckoId) {
      try {
        console.log(`Fetching price for token with coingeckoId: ${coingeckoId}`)
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
        )

        if (response.ok) {
          const data = await response.json()
          if (data[coingeckoId]) {
            const price: TokenPrice = {
              usd: data[coingeckoId].usd,
              usd_24h_change: data[coingeckoId].usd_24h_change,
              last_updated_at: data[coingeckoId].last_updated_at,
            }

            return price
          }
        } else {
          console.error(`CoinGecko API error for ${coingeckoId}:`, await response.text())
        }
      } catch (error) {
        logError(error, "getTokenPrice - Error fetching from CoinGecko with coingeckoId", { tokenAddress, coingeckoId })
        // Continue to other methods if CoinGecko fails
      }
    }

    // For well-known tokens, try to get price from CoinGecko using symbol
    if (symbol) {
      const knownTokenIds: Record<string, string> = {
        SOL: "solana",
        BONK: "bonk",
        SAMO: "samoyedcoin",
        RAY: "raydium",
        ORCA: "orca",
        USDC: "usd-coin",
        USDT: "tether",
        ETH: "ethereum",
        BTC: "bitcoin",
        JUP: "jupiter-exchange-solana", // Updated to correct ID
        PYTH: "pyth-network",
        // Add more known tokens here
        MANGO: "mango-markets",
        MNGO: "mango-markets",
        MSOL: "msol",
        STSOL: "lido-staked-sol",
        JSOL: "jito-sol",
        BSOL: "blazestake-staked-sol",
        SLND: "solend",
        DUST: "dust-protocol",
        MEAN: "meanfi",
        RENDER: "render-token",
        REN: "republic-protocol",
        SBR: "saber",
        STEP: "step-finance",
        ATLAS: "star-atlas",
        POLIS: "star-atlas-dao",
        AUDIO: "audius",
        FIDA: "bonfida",
        MAPS: "maps",
        COPE: "cope",
        TULIP: "tulip-protocol",
        SLIM: "solanium",
        MEDIA: "media-network",
        MER: "mercurial-finance",
        LIKE: "only1",
        GENE: "genopets",
        DFL: "defi-land",
        REAL: "realy-metaverse",
        PRISM: "prism-ag",
        UXP: "uxd-protocol",
        UXD: "uxd-stablecoin",
        WOOF: "woof-token",
        BORK: "bork",
        DOGWIFHAT: "dogwifhat",
        WIF: "dogwifhat",
        POPCAT: "popcat",
        NANA: "banana",
        BANANA: "banana",
        GUAC: "guacamole",
        TAKI: "taki",
        CROWN: "crowny",
        SHDW: "genesysgo-shadow",
        AURY: "aurory",
        PORT: "port-finance",
        SUNNY: "sunny-aggregator",
        GRAPE: "grape-protocol",
        SAIL: "solanasail-governance-token",
        SOLC: "solcial",
        SLRS: "solrise-finance",
        CWAR: "cryowar-token",
        CMFI: "compendium-fi",
        SOLAPE: "solape-token",
        NINJA: "ninja-protocol",
        APEX: "apexit-finance",
        SONAR: "sonarwatch",
        SOLI: "solana-ecosystem-index",
        GSAIL: "gsail",
        SOLX: "soldex",
        SOLPAD: "solpad-finance",
        SOLR: "solrazr",
        SOLANAX: "solanax",
        SOLFI: "solfi",
        SOLV: "solvent",
        SOLEX: "solex-finance",
        SOLACE: "solace",
        SOLC: "solcubator",
        SOLB: "solberg",
        SOLA: "solana-inu",
        SOLM: "solminter",
        SOLS: "solstarter",
        SOLT: "soltrade",
        SOLW: "solwallet",
        SOLY: "solytics",
        SOLZ: "solzilla",
      }

      const tokenId = knownTokenIds[symbol.toUpperCase()]

      if (tokenId) {
        try {
          console.log(`Fetching price for known token: ${symbol} (${tokenId})`)
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
          )

          if (response.ok) {
            const data = await response.json()
            if (data[tokenId]) {
              const price: TokenPrice = {
                usd: data[tokenId].usd,
                usd_24h_change: data[tokenId].usd_24h_change,
                last_updated_at: data[tokenId].last_updated_at,
              }

              return price
            }
          } else {
            console.error(`CoinGecko API error for ${tokenId}:`, await response.text())
          }
        } catch (error) {
          logError(error, "getTokenPrice - Error fetching from CoinGecko", { tokenAddress, symbol })
          // Continue even if we can't get price from CoinGecko
        }
      }
    }

    // For now, return undefined for unknown tokens
    return undefined
  } catch (error) {
    logError(error, "getTokenPrice", { tokenAddress, symbol })
    return undefined
  }
}

/**
 * Gets market data for a token
 */
export async function getTokenMarketData(tokenAddress: string, symbol?: string): Promise<TokenMarketData | undefined> {
  try {
    // Try to get market data from Jupiter API
    try {
      console.log("Attempting to fetch market data from Jupiter API")
      // This endpoint is no longer available, so we'll use the token info endpoint and extract what we can
      const jupiterUrl = `https://lite-api.jup.ag/tokens/v1/token/${tokenAddress}`

      const jupiterResponse = await fetch(jupiterUrl)

      if (jupiterResponse.ok) {
        const data = await jupiterResponse.json()
        console.log("Jupiter market data response:", JSON.stringify(data).substring(0, 200) + "...")

        if (data) {
          const marketData: TokenMarketData = {
            volume24h: data.daily_volume,
          }

          // If we have a coingeckoId, try to get more market data from CoinGecko
          if (data.extensions?.coingeckoId) {
            try {
              console.log(`Found coingeckoId in Jupiter data: ${data.extensions.coingeckoId}, fetching from CoinGecko`)
              const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/${data.extensions.coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
              )

              if (response.ok) {
                const cgData = await response.json()
                if (cgData.market_data) {
                  marketData.marketCap = cgData.market_data.market_cap?.usd
                  marketData.volume24h = cgData.market_data.total_volume?.usd || marketData.volume24h
                  marketData.high24h = cgData.market_data.high_24h?.usd
                  marketData.low24h = cgData.market_data.low_24h?.usd
                  marketData.allTimeHigh = cgData.market_data.ath?.usd
                  marketData.allTimeHighDate = cgData.market_data.ath_date?.usd
                  marketData.circulatingSupply = cgData.market_data.circulating_supply
                  marketData.totalSupply = cgData.market_data.total_supply
                  marketData.fullyDilutedValuation = cgData.market_data.fully_diluted_valuation?.usd
                  marketData.rank = cgData.market_cap_rank
                }
              }
            } catch (error) {
              console.error(`Error fetching from CoinGecko with coingeckoId ${data.extensions.coingeckoId}:`, error)
            }
          }

          return marketData
        }
      } else {
        console.log(`Jupiter market data API returned status ${jupiterResponse.status}`)
      }
    } catch (error) {
      logError(error, "getTokenMarketData - Error fetching from Jupiter", { tokenAddress, symbol })
      // Continue to other methods if Jupiter fails
    }

    // For well-known tokens, try to get market data from CoinGecko
    if (symbol) {
      const knownTokenIds: Record<string, string> = {
        SOL: "solana",
        BONK: "bonk",
        SAMO: "samoyedcoin",
        RAY: "raydium",
        ORCA: "orca",
        USDC: "usd-coin",
        USDT: "tether",
        ETH: "ethereum",
        BTC: "bitcoin",
        JUP: "jupiter-exchange-solana",
        PYTH: "pyth-network",
      }

      const tokenId = knownTokenIds[symbol.toUpperCase()]

      if (tokenId) {
        try {
          console.log(`Fetching market data for known token: ${symbol} (${tokenId})`)
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`,
          )

          if (response.ok) {
            const data = await response.json()
            if (data.market_data) {
              const marketData: TokenMarketData = {
                marketCap: data.market_data.market_cap?.usd,
                volume24h: data.market_data.total_volume?.usd,
                high24h: data.market_data.high_24h?.usd,
                low24h: data.market_data.low_24h?.usd,
                allTimeHigh: data.market_data.ath?.usd,
                allTimeHighDate: data.market_data.ath_date?.usd,
                circulatingSupply: data.market_data.circulating_supply,
                totalSupply: data.market_data.total_supply,
                fullyDilutedValuation: data.market_data.fully_diluted_valuation?.usd,
                rank: data.market_cap_rank,
              }

              return marketData
            }
          } else {
            console.error(`CoinGecko market data API error for ${tokenId}:`, await response.text())
          }
        } catch (error) {
          logError(error, "getTokenMarketData - Error fetching from CoinGecko", { tokenAddress, symbol })
          // Continue even if we can't get market data from CoinGecko
        }
      }
    }

    // For now, return undefined for unknown tokens
    return undefined
  } catch (error) {
    logError(error, "getTokenMarketData", { tokenAddress, symbol })
    return undefined
  }
}

/**
 * Gets token holders for a given token address
 * Implements pagination to get all token holders using Helius API
 * Returns both the limited list of holders and the total count of unique holders
 */
export async function getTokenHolders(
  tokenAddress: string,
  bypassCache = false,
  limit = 100,
): Promise<TokenHoldersResult> {
  try {
    // If Helius is available, use it to get token holders
    if (RPC_CONFIG.premium.helius) {
      try {
        console.log("Attempting to fetch token holders from Helius API with pagination")
        const heliusUrl = RPC_CONFIG.premium.helius

        // Track unique holders and their amounts
        const holderMap = new Map<string, TokenHolder>()
        let page = 1
        let hasMoreResults = true
        const pageLimit = 1000 // Maximum results per page from Helius API
        let totalPages = 0

        // Get token decimals for proper amount calculation
        let decimals = 0
        try {
          const tokenInfo = await validateToken(tokenAddress)
          if (tokenInfo.valid && tokenInfo.token?.decimals) {
            decimals = tokenInfo.token.decimals
          }
        } catch (error) {
          console.error("Error getting token decimals:", error)
        }

        // Paginate through all results to count total unique holders
        while (hasMoreResults) {
          console.log(`Fetching token holders page ${page}...`)
          totalPages++

          // Use the getTokenAccounts method to get token holders with pagination
          const payload = {
            jsonrpc: "2.0",
            id: `helius-token-accounts-${page}`,
            method: "getTokenAccounts",
            params: {
              mint: tokenAddress,
              page: page,
              limit: pageLimit,
            },
          }

          console.log(`Sending getTokenAccounts request to Helius for page ${page}:`, JSON.stringify(payload))

          const response = await fetch(heliusUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          console.log(`Helius getTokenAccounts response status for page ${page}:`, response.status)

          if (response.ok) {
            const data = await response.json()
            console.log(
              `Helius getTokenAccounts response for page ${page}:`,
              JSON.stringify(data).substring(0, 200) + "...",
            )

            if (data.result && data.result.token_accounts && data.result.token_accounts.length > 0) {
              const accounts = data.result.token_accounts

              // Process each token account
              for (const account of accounts) {
                if (account.owner && account.amount > 0) {
                  const ownerAddress = account.owner
                  const amount = Number(account.amount) / Math.pow(10, decimals || 9)

                  // If we already have this owner, add to their amount
                  if (holderMap.has(ownerAddress)) {
                    const existingHolder = holderMap.get(ownerAddress)!
                    existingHolder.amount += amount
                    holderMap.set(ownerAddress, existingHolder)
                  } else {
                    // Otherwise, add a new holder
                    holderMap.set(ownerAddress, {
                      owner: ownerAddress,
                      amount,
                      decimals: decimals || 9,
                    })
                  }
                }
              }

              // If we got fewer results than the page limit, we've reached the end
              if (accounts.length < pageLimit) {
                hasMoreResults = false
              } else {
                page++
              }
            } else {
              // No more results
              hasMoreResults = false
            }
          } else {
            const errorText = await response.text()
            console.error(`Helius getTokenAccounts API error for page ${page}:`, errorText)
            hasMoreResults = false
          }

          // For performance reasons, limit the number of pages we fetch
          // This is a safety measure to prevent excessive API calls
          if (totalPages >= 10) {
            console.log("Reached maximum page limit (10), stopping pagination")
            hasMoreResults = false
          }
        }

        const totalUniqueHolders = holderMap.size
        console.log(`Total unique holders found: ${totalUniqueHolders} across ${totalPages} pages`)

        // Convert map to array and sort by amount (descending)
        const holders = Array.from(holderMap.values())
        holders.sort((a, b) => b.amount - a.amount)

        // Limit the number of holders returned for the UI
        const limitedHolders = holders.slice(0, limit)

        return {
          holders: limitedHolders,
          totalUniqueHolders,
        }
      } catch (error) {
        logError(error, "getTokenHolders - Error fetching from Helius", { tokenAddress })
        console.error("Detailed Helius getTokenAccounts API error:", error)
      }
    }

    // Fallback to using the Solana connection to get token accounts
    try {
      console.log("Falling back to Solana connection for token holders")
      const connection = getConnection()
      const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        commitment: "confirmed",
        filters: [
          {
            dataSize: 165, // Size of token account data
          },
          {
            memcmp: {
              offset: 0,
              bytes: tokenAddress,
            },
          },
        ],
      })

      console.log(`Found ${accounts.length} token accounts`)

      // Track unique holders and their amounts
      const holderMap = new Map<string, TokenHolder>()

      // Get token decimals for proper amount calculation
      let decimals = 0
      try {
        const tokenInfo = await validateToken(tokenAddress)
        if (tokenInfo.valid && tokenInfo.token?.decimals) {
          decimals = tokenInfo.token.decimals
        }
      } catch (error) {
        console.error("Error getting token decimals:", error)
      }

      // Process each token account
      for (const account of accounts) {
        try {
          const accountInfo = await connection.getAccountInfo(account.pubkey)
          if (accountInfo && accountInfo.data) {
            // Parse the account data to get the owner and amount
            // This is a simplified version and may not work for all token accounts
            const owner = new PublicKey(accountInfo.data.slice(32, 64))
            const amount = Number(accountInfo.data.slice(64, 72).readBigUInt64LE(0)) / Math.pow(10, decimals || 9)

            if (amount > 0) {
              const ownerAddress = owner.toString()

              // If we already have this owner, add to their amount
              if (holderMap.has(ownerAddress)) {
                const existingHolder = holderMap.get(ownerAddress)!
                existingHolder.amount += amount
                holderMap.set(ownerAddress, existingHolder)
              } else {
                // Otherwise, add a new holder
                holderMap.set(ownerAddress, {
                  owner: ownerAddress,
                  amount,
                  decimals: decimals || 9,
                })
              }
            }
          }
        } catch (error) {
          console.error("Error processing token account:", error)
        }
      }

      const totalUniqueHolders = holderMap.size
      console.log(`Total unique holders found: ${totalUniqueHolders}`)

      // Convert map to array and sort by amount (descending)
      const holders = Array.from(holderMap.values())
      holders.sort((a, b) => b.amount - a.amount)

      // Limit the number of holders returned for the UI
      const limitedHolders = holders.slice(0, limit)

      return {
        holders: limitedHolders,
        totalUniqueHolders,
      }
    } catch (error) {
      logError(error, "getTokenHolders - Error fetching from Solana connection", { tokenAddress })
    }

    // Return empty array and zero count if all methods fail
    return {
      holders: [],
      totalUniqueHolders: 0,
    }
  } catch (error) {
    logError(error, "getTokenHolders", { tokenAddress })
    return {
      holders: [],
      totalUniqueHolders: 0,
    }
  }
}

/**
 * Gets a list of known Solana tokens
 */
export function getKnownSolanaTokens(): string[] {
  return [
    "SOL",
    "BONK",
    "ORCA",
    "RAY",
    "SAMO",
    "USDC",
    "USDT",
    "JUP",
    "PYTH",
    "ETH",
    "BTC",
    "MANGO",
    "MNGO",
    "MSOL",
    "STSOL",
    "JSOL",
    "BSOL",
    "SLND",
    "DUST",
    "MEAN",
    "RENDER",
    "REN",
    "SBR",
    "STEP",
    "ATLAS",
    "POLIS",
    "AUDIO",
    "FIDA",
    "MAPS",
    "COPE",
    "TULIP",
    "SLIM",
    "MEDIA",
    "MER",
    "LIKE",
    "GENE",
    "DFL",
    "REAL",
    "PRISM",
    "UXP",
    "UXD",
    "WOOF",
    "BORK",
    "WIF",
    "POPCAT",
    "NANA",
    "BANANA",
    "GUAC",
    "TAKI",
    "CROWN",
    "SHDW",
    "AURY",
    "PORT",
    "SUNNY",
    "GRAPE",
    "SAIL",
    "SOLC",
    "SLRS",
    "CWAR",
    "CMFI",
    "SOLAPE",
    "NINJA",
    "APEX",
    "SONAR",
    "SOLI",
    "GSAIL",
    "SOLX",
    "SOLPAD",
    "SOLR",
    "SOLANAX",
    "SOLFI",
  ]
}

/**
 * Checks if a symbol is a known Solana token
 */
export function isKnownSolanaToken(symbol: string): boolean {
  return getKnownSolanaTokens().includes(symbol.toUpperCase())
}

/**
 * Validates a token address format (basic check)
 */
export function isValidTokenAddressFormat(address: string): boolean {
  // Check if it's a valid base58 string of appropriate length
  // Note: We're using a regex that matches the exact case pattern for base58
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  return base58Regex.test(address)
}

/**
 * Gets token metadata from the Solana token list
 * This is a fallback method when other APIs fail
 */
export async function getTokenFromSolanaTokenList(tokenAddress: string): Promise<TokenInfo | null> {
  try {
    console.log("Attempting to fetch token from Solana token list")
    const response = await fetch(
      "https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json",
    )

    if (response.ok) {
      const data = await response.json()
      if (data.tokens) {
        const token = data.tokens.find((t: any) => t.address === tokenAddress)
        if (token) {
          return {
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            logoUrl: token.logoURI,
            isValid: true,
            metadata: {
              solanaTokenList: token,
            },
          }
        }
      }
    }
    return null
  } catch (error) {
    console.error("Error fetching from Solana token list:", error)
    return null
  }
}
