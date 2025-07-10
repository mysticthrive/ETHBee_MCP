// This file contains configuration for RPC providers

interface RPCConfig {
  default: string
  fallbacks: string[]
  premium: {
    helius?: string
    quicknode?: string
  }
  getBestRpcUrl: () => string
}

// Get environment variables
const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || ""
const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL || ""
const PREFERRED_RPC_PROVIDER = process.env.PREFERRED_RPC_PROVIDER || ""

// Configuration for RPC providers
export const RPC_CONFIG: RPCConfig = {
  // Default public RPC endpoint
  default: "https://api.mainnet-beta.solana.com",

  // Fallback RPC endpoints
  fallbacks: [
    "https://solana-mainnet.g.alchemy.com/v2/demo",
    "https://rpc.ankr.com/solana",
    "https://mainnet.solana-rpc.com",
  ],

  // Premium RPC endpoints (if available)
  premium: {
    helius: HELIUS_RPC_URL,
    quicknode: QUICKNODE_RPC_URL,
  },

  // Function to get the best available RPC URL
  getBestRpcUrl: () => {
    console.log("Getting best RPC URL...")

    // If a preferred provider is specified, use it
    if (PREFERRED_RPC_PROVIDER) {
      console.log(`Using preferred RPC provider: ${PREFERRED_RPC_PROVIDER}`)

      if (PREFERRED_RPC_PROVIDER === "helius" && HELIUS_RPC_URL) {
        return HELIUS_RPC_URL
      }

      if (PREFERRED_RPC_PROVIDER === "quicknode" && QUICKNODE_RPC_URL) {
        return QUICKNODE_RPC_URL
      }
    }

    // If Helius is available, use it
    if (HELIUS_RPC_URL) {
      console.log("Using Helius RPC")
      return HELIUS_RPC_URL
    }

    // If QuickNode is available, use it
    if (QUICKNODE_RPC_URL) {
      console.log("Using QuickNode RPC")
      return QUICKNODE_RPC_URL
    }

    // Otherwise, use the default RPC
    console.log("Using default public RPC")
    return RPC_CONFIG.default
  },
}

// Function to check if an RPC URL is responsive
export async function checkRpcHealth(rpcUrl: string): Promise<boolean> {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "health-check",
        method: "getHealth",
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.result === "ok"
    }

    return false
  } catch (error) {
    console.error(`RPC health check failed for ${rpcUrl}:`, error)
    return false
  }
}

// Function to get a working RPC URL with fallbacks
export async function getWorkingRpcUrl(): Promise<string> {
  // First try the best RPC URL
  const bestRpcUrl = RPC_CONFIG.getBestRpcUrl()
  const isBestRpcHealthy = await checkRpcHealth(bestRpcUrl)

  if (isBestRpcHealthy) {
    return bestRpcUrl
  }

  console.warn(`Best RPC URL ${bestRpcUrl} is not healthy, trying fallbacks...`)

  // Try fallbacks
  for (const fallbackUrl of RPC_CONFIG.fallbacks) {
    const isFallbackHealthy = await checkRpcHealth(fallbackUrl)
    if (isFallbackHealthy) {
      return fallbackUrl
    }
  }

  // If all else fails, return the default and hope for the best
  console.warn("All RPC URLs failed health checks, using default as last resort")
  return RPC_CONFIG.default
}
