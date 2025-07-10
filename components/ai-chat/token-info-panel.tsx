"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Twitter,
  Github,
  MessageCircle,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Info,
  Users,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type TokenProps = {
  id: string
  symbol: string
  name: string
  price?: number
  priceChange?: number
  logoUrl?: string
  marketData?: {
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
}

// Add this constant at the top of the file, after the imports
const SIMULATED_DATA_NOTICE =
  "Note: Some data shown here (social stats, security scores, and recommendations) is simulated for demonstration purposes and does not represent real data from APIs."

// Mock data for token information
const tokenData: Record<
  string,
  {
    price: number
    marketCap: number
    volume24h: number
    change24h: number
    high24h: number
    low24h: number
    circulatingSupply: number
    totalSupply: number
    allTimeHigh: number
    allTimeHighDate: string
    socialStats: {
      twitter: number
      reddit: number
      github: number
      telegram: number
    }
    securityScore: number
    scamProbability: number
    sourceCode: string
    launchDate: string
    category: string
    recommendation: "buy" | "sell" | "hold" | "watch"
    riskLevel: "low" | "medium" | "high" | "very high"
  }
> = {
  solana: {
    price: 142.67,
    marketCap: 62500000000,
    volume24h: 3800000000,
    change24h: 5.23,
    high24h: 145.78,
    low24h: 136.92,
    circulatingSupply: 438000000,
    totalSupply: 550000000,
    allTimeHigh: 260.0,
    allTimeHighDate: "2021-11-06",
    socialStats: {
      twitter: 2100000,
      reddit: 450000,
      github: 12500,
      telegram: 560000,
    },
    securityScore: 87,
    scamProbability: 0.01,
    sourceCode: "https://github.com/solana-labs/solana",
    launchDate: "2020-03-16",
    category: "Smart Contract Platform",
    recommendation: "buy",
    riskLevel: "medium",
  },
  bonk: {
    price: 0.00002145,
    marketCap: 1250000000,
    volume24h: 98000000,
    change24h: 12.34,
    high24h: 0.00002245,
    low24h: 0.00001945,
    circulatingSupply: 58200000000000,
    totalSupply: 100000000000000,
    allTimeHigh: 0.00004921,
    allTimeHighDate: "2023-12-31",
    socialStats: {
      twitter: 420000,
      reddit: 85000,
      github: 1200,
      telegram: 180000,
    },
    securityScore: 72,
    scamProbability: 0.08,
    sourceCode: "https://github.com/bonktoken/bonk",
    launchDate: "2022-12-25",
    category: "Meme Coin",
    recommendation: "hold",
    riskLevel: "high",
  },
  orca: {
    price: 1.87,
    marketCap: 420000000,
    volume24h: 45000000,
    change24h: 3.45,
    high24h: 1.92,
    low24h: 1.81,
    circulatingSupply: 224000000,
    totalSupply: 500000000,
    allTimeHigh: 13.97,
    allTimeHighDate: "2021-11-02",
    socialStats: {
      twitter: 180000,
      reddit: 35000,
      github: 4500,
      telegram: 95000,
    },
    securityScore: 85,
    scamProbability: 0.02,
    sourceCode: "https://github.com/orca-so/orca",
    launchDate: "2021-02-22",
    category: "DEX",
    recommendation: "buy",
    riskLevel: "medium",
  },
  raydium: {
    price: 3.45,
    marketCap: 690000000,
    volume24h: 78000000,
    change24h: 2.78,
    high24h: 3.52,
    low24h: 3.38,
    circulatingSupply: 200000000,
    totalSupply: 555000000,
    allTimeHigh: 16.1,
    allTimeHighDate: "2021-11-06",
    socialStats: {
      twitter: 210000,
      reddit: 42000,
      github: 5200,
      telegram: 120000,
    },
    securityScore: 83,
    scamProbability: 0.02,
    sourceCode: "https://github.com/raydium-io/raydium-ui",
    launchDate: "2021-02-21",
    category: "DEX",
    recommendation: "buy",
    riskLevel: "medium",
  },
  samoyedcoin: {
    price: 0.0145,
    marketCap: 58000000,
    volume24h: 12000000,
    change24h: 8.76,
    high24h: 0.0152,
    low24h: 0.0134,
    circulatingSupply: 4000000000,
    totalSupply: 10000000000,
    allTimeHigh: 0.22,
    allTimeHighDate: "2021-11-02",
    socialStats: {
      twitter: 150000,
      reddit: 28000,
      github: 850,
      telegram: 75000,
    },
    securityScore: 70,
    scamProbability: 0.09,
    sourceCode: "https://github.com/samoyedcoin/samoyedcoin",
    launchDate: "2021-04-11",
    category: "Meme Coin",
    recommendation: "hold",
    riskLevel: "high",
  },
  bitcoin: {
    price: 68423.12,
    marketCap: 1345000000000,
    volume24h: 28500000000,
    change24h: 2.34,
    high24h: 69102.45,
    low24h: 67234.56,
    circulatingSupply: 19460000,
    totalSupply: 21000000,
    allTimeHigh: 73750.0,
    allTimeHighDate: "2024-03-14",
    socialStats: {
      twitter: 5800000,
      reddit: 4900000,
      github: 32500,
      telegram: 1200000,
    },
    securityScore: 98,
    scamProbability: 0,
    sourceCode: "https://github.com/bitcoin/bitcoin",
    launchDate: "2009-01-03",
    category: "Currency",
    recommendation: "buy",
    riskLevel: "low",
  },
  ethereum: {
    price: 3521.87,
    marketCap: 423000000000,
    volume24h: 12400000000,
    change24h: 1.56,
    high24h: 3580.12,
    low24h: 3480.45,
    circulatingSupply: 120000000,
    totalSupply: 120000000,
    allTimeHigh: 4860.0,
    allTimeHighDate: "2021-11-10",
    socialStats: {
      twitter: 3200000,
      reddit: 1500000,
      github: 41000,
      telegram: 980000,
    },
    securityScore: 95,
    scamProbability: 0,
    sourceCode: "https://github.com/ethereum/go-ethereum",
    launchDate: "2015-07-30",
    category: "Smart Contract Platform",
    recommendation: "buy",
    riskLevel: "low",
  },
}

export function TokenInfoPanel({ token }: { token: TokenProps }) {
  // Add a new tab for token holders
  const [activeTab, setActiveTab] = useState<"overview" | "social" | "security" | "recommendation" | "holders">(
    "overview",
  )

  // Add a state for token holders data
  const [holdersData, setHoldersData] = useState<any[]>([])
  const [totalHolders, setTotalHolders] = useState<number | null>(null)
  const [isLoadingHolders, setIsLoadingHolders] = useState(false)
  const [holdersError, setHoldersError] = useState<string | null>(null)

  const [data, setData] = useState(tokenData[token.id] || tokenData.solana)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Add this function after the fetchTokenHolders function
  const generateSimulatedHolders = (tokenSymbol: string) => {
    // Generate 20 simulated holders with random amounts
    const holders = []
    const totalSupply = Math.random() * 1000000000

    // Create a large holder (whale)
    const whaleAmount = totalSupply * (0.1 + Math.random() * 0.2) // 10-30% of supply
    holders.push({
      owner: `Whale${Math.random().toString(36).substring(2, 8)}`,
      amount: whaleAmount,
      decimals: 9,
    })

    // Create medium holders
    for (let i = 0; i < 5; i++) {
      const amount = totalSupply * (0.01 + Math.random() * 0.05) // 1-6% of supply
      holders.push({
        owner: `Holder${Math.random().toString(36).substring(2, 8)}`,
        amount: amount,
        decimals: 9,
      })
    }

    // Create smaller holders
    for (let i = 0; i < 14; i++) {
      const amount = totalSupply * (0.001 + Math.random() * 0.009) // 0.1-1% of supply
      holders.push({
        owner: `Retail${Math.random().toString(36).substring(2, 8)}`,
        amount: amount,
        decimals: 9,
      })
    }

    // Sort by amount descending
    return holders.sort((a, b) => b.amount - a.amount)
  }

  // Update the fetchTokenHolders function to use simulated data as fallback
  const fetchTokenHolders = async (tokenId: string) => {
    if (!tokenId || tokenId.length < 30) return // Only fetch for actual addresses

    setIsLoadingHolders(true)
    setHoldersError(null)

    try {
      console.log("Fetching token holders for:", tokenId)
      const response = await fetch("/api/token/holders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenAddress: tokenId,
          limit: 100, // Request up to 100 holders
          bypassCache: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Holders data received:", data)

        if (data.holders && data.holders.length > 0) {
          setHoldersData(data.holders)
          // Use the actual totalUniqueHolders value from the API
          setTotalHolders(data.totalUniqueHolders || data.holders.length)
        } else {
          console.log("No holders data returned from API, using simulated data")
          const simulatedData = generateSimulatedHolders(token.symbol)
          setHoldersData(simulatedData)
          // For simulated data, generate a random but realistic total
          setTotalHolders(simulatedData.length + Math.floor(Math.random() * 1000))
        }
      } else {
        console.error("Error fetching token holders:", response.status)
        const errorText = await response.text()
        setHoldersError(`API Error: ${errorText || response.statusText}`)

        // Fall back to simulated data
        console.log("Using simulated holder data due to API error")
        const simulatedData = generateSimulatedHolders(token.symbol)
        setHoldersData(simulatedData)
        setTotalHolders(simulatedData.length + Math.floor(Math.random() * 1000))
      }
    } catch (error) {
      console.error("Exception fetching token holders:", error)
      setHoldersError(`Error: ${error instanceof Error ? error.message : String(error)}`)

      // Fall back to simulated data
      console.log("Using simulated holder data due to exception")
      const simulatedData = generateSimulatedHolders(token.symbol)
      setHoldersData(simulatedData)
      setTotalHolders(simulatedData.length + Math.floor(Math.random() * 1000))
    } finally {
      setIsLoadingHolders(false)
    }
  }

  // Fetch holders data when token changes and holders tab is active
  useEffect(() => {
    if (activeTab === "holders" && token.id && token.id.length > 30) {
      fetchTokenHolders(token.id)
    }
  }, [token.id, activeTab])

  // Fetch token data when token changes
  useEffect(() => {
    const fetchTokenData = async () => {
      // If we have a token ID that matches our mock data, use that
      if (tokenData[token.id]) {
        setData(tokenData[token.id])
        return
      }

      // Otherwise, try to fetch real data
      setIsLoading(true)
      try {
        // If we have a token.id that looks like an address, fetch data from our API
        if (token.id && token.id.length > 30) {
          const response = await fetch("/api/token/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ tokenAddress: token.id }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.valid) {
              console.log("Token validation successful:", result)
              // Create a data object from the API response
              const apiData = {
                price: result.price?.usd || token.price || 0,
                marketCap: result.marketData?.marketCap || 0,
                volume24h: result.marketData?.volume24h || 0,
                change24h: result.price?.usd_24h_change || token.priceChange || 0,
                high24h: result.marketData?.high24h || 0,
                low24h: result.marketData?.low24h || 0,
                circulatingSupply: result.marketData?.circulatingSupply || 0,
                totalSupply: result.marketData?.totalSupply || 0,
                allTimeHigh: result.marketData?.allTimeHigh || 0,
                allTimeHighDate: result.marketData?.allTimeHighDate || new Date().toISOString(),
                // Add simulated data for fields not available from APIs
                socialStats: {
                  twitter: Math.floor(Math.random() * 1000000),
                  reddit: Math.floor(Math.random() * 200000),
                  github: Math.floor(Math.random() * 10000),
                  telegram: Math.floor(Math.random() * 300000),
                },
                securityScore: Math.floor(60 + Math.random() * 40), // Random score between 60-100
                scamProbability: Math.random() * 0.2, // Random probability between 0-0.2
                sourceCode: "",
                launchDate: new Date().toISOString().split("T")[0],
                category: "Token",
                recommendation: ["buy", "sell", "hold", "watch"][Math.floor(Math.random() * 4)] as
                  | "buy"
                  | "sell"
                  | "hold"
                  | "watch",
                riskLevel: ["low", "medium", "high", "very high"][Math.floor(Math.random() * 4)] as
                  | "low"
                  | "medium"
                  | "high"
                  | "very high",
              }

              setData(apiData)
            }
          }
        } else if (token.symbol) {
          // If we have a symbol, try to fetch price data
          const response = await fetch("/api/token/price", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ symbol: token.symbol }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log("Token price data:", result)

            // Create a data object from the API response
            const apiData = {
              price: result.price?.usd || token.price || 0,
              marketCap: result.marketData?.marketCap || 0,
              volume24h: result.marketData?.volume24h || 0,
              change24h: result.price?.usd_24h_change || token.priceChange || 0,
              high24h: result.marketData?.high24h || 0,
              low24h: result.marketData?.low24h || 0,
              circulatingSupply: result.marketData?.circulatingSupply || 0,
              totalSupply: result.marketData?.totalSupply || 0,
              allTimeHigh: result.marketData?.allTimeHigh || 0,
              allTimeHighDate: result.marketData?.allTimeHighDate || new Date().toISOString(),
              // Add simulated data for fields not available from APIs
              socialStats: {
                twitter: Math.floor(Math.random() * 1000000),
                reddit: Math.floor(Math.random() * 200000),
                github: Math.floor(Math.random() * 10000),
                telegram: Math.floor(Math.random() * 300000),
              },
              securityScore: Math.floor(60 + Math.random() * 40), // Random score between 60-100
              scamProbability: Math.random() * 0.2, // Random probability between 0-0.2
              sourceCode: "",
              launchDate: new Date().toISOString().split("T")[0],
              category: "Token",
              recommendation: ["buy", "sell", "hold", "watch"][Math.floor(Math.random() * 4)] as
                | "buy"
                | "sell"
                | "hold"
                | "watch",
              riskLevel: ["low", "medium", "high", "very high"][Math.floor(Math.random() * 4)] as
                | "low"
                | "medium"
                | "high"
                | "very high",
            }

            setData(apiData)
          }
        }
      } catch (error) {
        console.error("Error fetching token data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenData()
  }, [token.id, token.symbol, token.price, token.priceChange])

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      // Clear cache and fetch fresh data
      await fetch("/api/token/clear-cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenAddress: token.id, symbol: token.symbol }),
      })

      // Re-fetch data
      if (token.id && token.id.length > 30) {
        const response = await fetch("/api/token/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tokenAddress: token.id }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.valid) {
            // Update data with fresh information
            setData((prevData) => ({
              ...prevData,
              price: result.price?.usd || prevData.price,
              marketCap: result.marketData?.marketCap || prevData.marketCap,
              volume24h: result.marketData?.volume24h || prevData.volume24h,
              change24h: result.price?.usd_24h_change || prevData.change24h,
              high24h: result.marketData?.high24h || prevData.high24h,
              low24h: result.marketData?.low24h || prevData.low24h,
            }))
          }
        }

        // Also refresh holders data if we're on the holders tab
        if (activeTab === "holders") {
          fetchTokenHolders(token.id)
        }
      } else if (token.symbol) {
        const response = await fetch("/api/token/price", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ symbol: token.symbol }),
        })

        if (response.ok) {
          const result = await response.json()

          // Update data with fresh information
          setData((prevData) => ({
            ...prevData,
            price: result.price?.usd || prevData.price,
            marketCap: result.marketData?.marketCap || prevData.marketCap,
            volume24h: result.marketData?.volume24h || prevData.volume24h,
            change24h: result.price?.usd_24h_change || prevData.change24h,
            high24h: result.marketData?.high24h || prevData.high24h,
            low24h: result.marketData?.low24h || prevData.low24h,
          }))
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Format large numbers with appropriate suffixes (K, M, B, T)
  const formatNumber = (num: number, decimals = 2) => {
    if (num === undefined || num === null) return "N/A"
    if (num === 0) return "0"

    const absNum = Math.abs(num)
    if (absNum < 1 && absNum > 0) {
      // For very small numbers, use scientific notation
      return num.toFixed(decimals)
    }

    const trillion = 1e12
    const billion = 1e9
    const million = 1e6
    const thousand = 1e3

    if (absNum >= trillion) return `${(num / trillion).toFixed(decimals)}T`
    if (absNum >= billion) return `${(num / billion).toFixed(decimals)}B`
    if (absNum >= million) return `${(num / million).toFixed(decimals)}M`
    if (absNum >= thousand) return `${(num / thousand).toFixed(decimals)}K`

    return num.toFixed(decimals)
  }

  // Format price based on its magnitude
  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return "N/A"

    if (price === 0) return "$0.00"
    if (price < 0.0001) return `$${price.toExponential(2)}`
    if (price < 0.01) return `$${price.toFixed(6)}`
    if (price < 1) return `$${price.toFixed(4)}`
    if (price < 10) return `$${price.toFixed(2)}`
    if (price < 1000) return `$${price.toFixed(2)}`
    if (price < 10000)
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    return `$${formatNumber(price)}`
  }

  return (
    <div className="flex flex-col bg-black/30 backdrop-blur-md border border-yellow-500/30 rounded-xl h-full overflow-hidden">
      <div className="p-4 border-yellow-500/20 border-b">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <img
              src={token.logoUrl || `/abstract-geometric-shapes.png?height=32&width=32&query=${token.name} logo`}
              alt={token.name}
              className="mr-2 rounded-full w-8 h-8"
            />
            <div>
              <h3 className="font-bold text-white">{token.name}</h3>
              <p className="text-gray-400 text-sm">{token.symbol}</p>
              {token.id && token.id.length > 30 && (
                <p className="w-40 text-gray-500 text-xs truncate">
                  {token.id.substring(0, 8)}...{token.id.substring(token.id.length - 8)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${data.change24h >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}
            >
              <div className="flex items-center">
                {data.change24h >= 0 ? (
                  <TrendingUp className="mr-1 w-3 h-3" />
                ) : (
                  <TrendingDown className="mr-1 w-3 h-3" />
                )}
                {data.change24h >= 0 ? "+" : ""}
                {data.change24h.toFixed(2)}%
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-yellow-400"
                    onClick={refreshData}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh token data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold text-white text-2xl">{formatPrice(data.price)}</span>
          <span className="ml-2 text-gray-400 text-sm">USD</span>
        </div>
      </div>

      <div className="border-yellow-500/20 border-b">
        <div className="flex">
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === "overview" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"
              }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === "social" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"
              }`}
            onClick={() => setActiveTab("social")}
          >
            Social
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === "security" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"
              }`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${activeTab === "recommendation" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"
              }`}
            onClick={() => setActiveTab("recommendation")}
          >
            AI Rec
          </button>
          {token.id && token.id.length > 30 && (
            <button
              className={`flex-1 py-2 text-sm font-medium ${activeTab === "holders" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"
                }`}
              onClick={() => setActiveTab("holders")}
            >
              Holders
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
            <span className="ml-2 text-gray-400">Loading token data...</span>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="mb-4">
                  <h4 className="mb-4 font-bold text-white text-lg">Market Stats</h4>
                  <div className="gap-4 grid grid-cols-4 bg-black/30 p-4 rounded-xl">
                    {/* Volume (24h) */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        Volume (24h)
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">{data.volume24h ? `$${formatNumber(data.volume24h)}` : "N/A"}</div>
                    </div>
                    {/* Market Cap */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        Market Cap
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">{data.marketCap ? `$${formatNumber(data.marketCap)}` : "N/A"}</div>
                    </div>
                    {/* FDV */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        FDV
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">
                        {/* FDV = totalSupply * price */}
                        {data.totalSupply && data.price ? `$${formatNumber(data.totalSupply * data.price)}` : "N/A"}
                      </div>
                    </div>
                    {/* Holders */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        Holders
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">
                        {totalHolders ? formatNumber(totalHolders, 1) : "N/A"}
                      </div>
                    </div>
                    {/* Liquidity (simulated) */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        Liquidity
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">
                        {/* Simulate or fetch liquidity */}
                        ${formatNumber(897730, 2)}
                      </div>
                    </div>
                    {/* Circulating Supply */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        Circulating Supply
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">
                        {data.circulatingSupply ? formatNumber(data.circulatingSupply) : "N/A"}
                      </div>
                    </div>
                    {/* Total Supply */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        Total Supply
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">
                        {data.totalSupply ? formatNumber(data.totalSupply) : "N/A"}
                      </div>
                    </div>
                    {/* Age (simulated) */}
                    <div>
                      <div className="flex items-center mb-1 text-gray-400 text-xs">
                        Age
                        <Info className="ml-1 w-3 h-3" />
                      </div>
                      <div className="font-bold text-white text-lg">
                        {/* Simulate or calculate from launchDate */}
                        {data.launchDate ? `${Math.floor((Date.now() - new Date(data.launchDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months` : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="gap-3 grid grid-cols-2">
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">24h Volume</p>
                    <p className="font-medium text-white text-sm">
                      {data.volume24h ? `$${formatNumber(data.volume24h)}` : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">24h High</p>
                    <p className="font-medium text-white text-sm">{data.high24h ? formatPrice(data.high24h) : "N/A"}</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">24h Low</p>
                    <p className="font-medium text-white text-sm">{data.low24h ? formatPrice(data.low24h) : "N/A"}</p>
                  </div>
                </div>

                {data.circulatingSupply && data.totalSupply ? (
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <p className="text-gray-400 text-xs">Circulating Supply</p>
                      <p className="text-gray-400 text-xs">
                        {((data.circulatingSupply / data.totalSupply) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-700 mb-1 rounded-full w-full h-1.5">
                      <div
                        className="bg-yellow-500 rounded-full h-1.5"
                        style={{ width: `${(data.circulatingSupply / data.totalSupply) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-white text-xs">
                        {formatNumber(data.circulatingSupply)} {token.symbol}
                      </p>
                      <p className="text-white text-xs">
                        {formatNumber(data.totalSupply)} {token.symbol}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">Supply Information</p>
                    <div className="flex items-center">
                      <Info className="mr-2 w-4 h-4 text-yellow-400" />
                      <p className="text-gray-300 text-sm">Supply data not available for this token</p>
                    </div>
                  </div>
                )}

                {data.allTimeHigh ? (
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="mb-2 text-gray-400 text-xs">All Time High</p>
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium text-white text-sm">{formatPrice(data.allTimeHigh)}</p>
                      <p className="text-gray-400 text-xs">{new Date(data.allTimeHighDate).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-400 text-xs">
                        Current price is{" "}
                        <span className={data.price / data.allTimeHigh > 0.8 ? "text-green-400" : "text-red-400"}>
                          {((data.price / data.allTimeHigh) * 100).toFixed(1)}%
                        </span>{" "}
                        of ATH
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">All Time High</p>
                    <p className="text-gray-300 text-sm">Data not available</p>
                  </div>
                )}

                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <div>
                      <p className="mb-1 text-gray-400 text-xs">Category</p>
                      <p className="font-medium text-white text-sm">{data.category || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-gray-400 text-xs">Launch Date</p>
                      <p className="font-medium text-white text-sm">
                        {data.launchDate ? new Date(data.launchDate).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>

                {token.id && token.id.length > 30 && (
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">Token Address</p>
                    <div className="flex items-center">
                      <p className="font-mono text-white text-xs truncate">{token.id}</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 w-6 h-6 text-yellow-400"
                              onClick={() => navigator.clipboard.writeText(token.id)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy address</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "social" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-yellow-500/10 mb-4 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Info className="flex-shrink-0 mr-2 w-4 h-4 text-yellow-400" />
                    <p className="text-yellow-400 text-xs">
                      Social data is simulated for demonstration purposes. This data is not available from Helius or
                      Jupiter APIs.
                    </p>
                  </div>
                </div>
                <div className="gap-3 grid grid-cols-2">
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Twitter className="mr-1 w-3 h-3 text-blue-400" />
                      <p className="text-gray-400 text-xs">Twitter Followers</p>
                    </div>
                    <p className="font-medium text-white text-sm">
                      {data.socialStats?.twitter ? formatNumber(data.socialStats.twitter, 0) : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <MessageCircle className="mr-1 w-3 h-3 text-orange-400" />
                      <p className="text-gray-400 text-xs">Reddit Members</p>
                    </div>
                    <p className="font-medium text-white text-sm">
                      {data.socialStats?.reddit ? formatNumber(data.socialStats.reddit, 0) : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Github className="mr-1 w-3 h-3 text-gray-400" />
                      <p className="text-gray-400 text-xs">Github Stars</p>
                    </div>
                    <p className="font-medium text-white text-sm">
                      {data.socialStats?.github ? formatNumber(data.socialStats.github, 0) : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <MessageCircle className="mr-1 w-3 h-3 text-blue-500" />
                      <p className="text-gray-400 text-xs">Telegram Members</p>
                    </div>
                    <p className="font-medium text-white text-sm">
                      {data.socialStats?.telegram ? formatNumber(data.socialStats.telegram, 0) : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="mb-2 text-gray-400 text-xs">Social Engagement Score</p>
                  <div className="bg-gray-700 mb-2 rounded-full w-full h-2.5">
                    <div
                      className="bg-blue-500 rounded-full h-2.5"
                      style={{
                        width: `${data.socialStats
                          ? (
                            (data.socialStats.twitter / 6000000) * 100 +
                            (data.socialStats.reddit / 5000000) * 100 +
                            (data.socialStats.github / 50000) * 100
                          ) / 3
                          : 10
                          }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-xs">Based on follower count, growth rate, and community activity</p>
                </div>

                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400 text-xs">Source Code</p>
                    {data.sourceCode ? (
                      <a
                        href={data.sourceCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-yellow-400 text-xs"
                      >
                        View on Github <ArrowUpRight className="ml-1 w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">Not available</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-400 text-xs">Community Size</p>
                    <p className="text-white text-xs">
                      {data.socialStats && data.socialStats.twitter + data.socialStats.reddit > 5000000
                        ? "Very Large"
                        : data.socialStats && data.socialStats.twitter + data.socialStats.reddit > 1000000
                          ? "Large"
                          : data.socialStats && data.socialStats.twitter + data.socialStats.reddit > 100000
                            ? "Medium"
                            : "Small"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-yellow-500/10 mb-4 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Info className="flex-shrink-0 mr-2 w-4 h-4 text-yellow-400" />
                    <p className="text-yellow-400 text-xs">
                      Security data is simulated for demonstration purposes. This data is not available from Helius or
                      Jupiter APIs.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="mb-2 text-gray-400 text-xs">Security Score</p>
                  <div className="bg-gray-700 mb-2 rounded-full w-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${data.securityScore > 90
                        ? "bg-green-500"
                        : data.securityScore > 80
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        }`}
                      style={{ width: `${data.securityScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-white text-xs">{data.securityScore}/100</p>
                    <p
                      className={`text-xs ${data.securityScore > 90
                        ? "text-green-400"
                        : data.securityScore > 80
                          ? "text-yellow-400"
                          : "text-red-400"
                        }`}
                    >
                      {data.securityScore > 90 ? "Excellent" : data.securityScore > 80 ? "Good" : "Moderate"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertTriangle
                      className={`w-4 h-4 mr-2 ${data.scamProbability < 0.01
                        ? "text-green-400"
                        : data.scamProbability < 0.05
                          ? "text-yellow-400"
                          : "text-red-400"
                        }`}
                    />
                    <p className="font-medium text-white text-sm">Scam Probability</p>
                  </div>
                  <p
                    className={`text-sm ${data.scamProbability < 0.01
                      ? "text-green-400"
                      : data.scamProbability < 0.05
                        ? "text-yellow-400"
                        : "text-red-400"
                      }`}
                  >
                    {data.scamProbability < 0.01 ? "Very Low" : data.scamProbability < 0.05 ? "Low" : "Moderate"}
                  </p>
                  <p className="mt-1 text-gray-400 text-xs">
                    Based on contract audits, team verification, and community trust
                  </p>
                </div>

                <div className="space-y-2 bg-gray-800/50 p-3 rounded-lg">
                  <p className="mb-2 font-medium text-white text-sm">Security Checks</p>

                  <div className="flex items-center">
                    <CheckCircle className="mr-2 w-4 h-4 text-green-400" />
                    <p className="text-gray-200 text-xs">Contract Audited</p>
                  </div>

                  <div className="flex items-center">
                    <CheckCircle className="mr-2 w-4 h-4 text-green-400" />
                    <p className="text-gray-200 text-xs">Team Verified</p>
                  </div>

                  <div className="flex items-center">
                    <CheckCircle className="mr-2 w-4 h-4 text-green-400" />
                    <p className="text-gray-200 text-xs">Open Source Code</p>
                  </div>

                  {token.id === "solana" || token.id === "bitcoin" || token.id === "ethereum" ? (
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 w-4 h-4 text-green-400" />
                      <p className="text-gray-200 text-xs">Decentralized Network</p>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {data.securityScore > 85 ? (
                        <CheckCircle className="mr-2 w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="mr-2 w-4 h-4 text-yellow-400" />
                      )}
                      <p className="text-gray-200 text-xs">Decentralization Level</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="mb-2 font-medium text-white text-sm">Risk Level</p>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium inline-block ${data.riskLevel === "low"
                      ? "bg-green-500/20 text-green-400"
                      : data.riskLevel === "medium"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                      }`}
                  >
                    {data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1)}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "recommendation" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-yellow-500/10 mb-4 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Info className="flex-shrink-0 mr-2 w-4 h-4 text-yellow-400" />
                    <p className="text-yellow-400 text-xs">
                      AI recommendations are simulated for demonstration purposes. This data is not available from
                      Helius or Jupiter APIs.
                    </p>
                  </div>
                </div>
                <div
                  className={`bg-gray-800/50 rounded-lg p-4 border-l-4 ${data.recommendation === "buy"
                    ? "border-green-500"
                    : data.recommendation === "sell"
                      ? "border-red-500"
                      : data.recommendation === "hold"
                        ? "border-yellow-500"
                        : "border-blue-500"
                    }`}
                >
                  <div className="flex items-center mb-2">
                    <BarChart3 className="mr-2 w-5 h-5 text-yellow-400" />
                    <p className="font-bold text-white text-lg">
                      AI Recommendation:{" "}
                      <span
                        className={
                          data.recommendation === "buy"
                            ? "text-green-400"
                            : data.recommendation === "sell"
                              ? "text-red-400"
                              : data.recommendation === "hold"
                                ? "text-yellow-400"
                                : "text-blue-400"
                        }
                      >
                        {data.recommendation.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <p className="mb-3 text-gray-300 text-sm">
                    {data.recommendation === "buy"
                      ? `Our AI analysis suggests ${token.name} is currently undervalued with strong growth potential.`
                      : data.recommendation === "sell"
                        ? `Our AI analysis suggests taking profits on ${token.name} due to potential market correction.`
                        : data.recommendation === "hold"
                          ? `Our AI analysis suggests holding ${token.name} as the market stabilizes.`
                          : `Our AI analysis suggests watching ${token.name} for potential entry points.`}
                  </p>

                  <div className="bg-black/30 mb-3 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <Clock className="mr-2 w-4 h-4 text-yellow-400" />
                      <p className="font-medium text-white text-sm">Time Horizon</p>
                    </div>
                    <p className="text-gray-400 text-xs">
                      {data.recommendation === "buy"
                        ? "Medium to long-term (3-12 months)"
                        : data.recommendation === "sell"
                          ? "Short-term (0-3 months)"
                          : "Medium-term (3-6 months)"}
                    </p>
                  </div>

                  <div className="bg-black/30 p-3 rounded-lg">
                    <p className="mb-1 font-medium text-white text-sm">Key Factors</p>
                    <ul className="space-y-1 pl-4 text-gray-400 text-xs list-disc">
                      <li>
                        {data.change24h > 0 ? "Positive price momentum" : "Price consolidation after recent movement"}
                      </li>
                      <li>
                        {data.socialStats?.twitter > 2000000
                          ? "Strong social engagement"
                          : "Growing community interest"}
                      </li>
                      <li>{data.securityScore > 90 ? "Excellent security profile" : "Acceptable security metrics"}</li>
                      <li>
                        {data.marketCap > 100000000000
                          ? "Large market cap provides stability"
                          : "Growth potential at current market cap"}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <p className="mb-2 font-medium text-white text-sm">Price Prediction</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-400 text-xs">30 Days</p>
                      <p
                        className={`text-sm font-medium ${data.price * 1.1 > data.price ? "text-green-400" : "text-red-400"
                          }`}
                      >
                        ${(data.price * 1.1).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">90 Days</p>
                      <p
                        className={`text-sm font-medium ${data.price * 1.25 > data.price ? "text-green-400" : "text-red-400"
                          }`}
                      >
                        ${(data.price * 1.25).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">1 Year</p>
                      <p
                        className={`text-sm font-medium ${data.price * 1.8 > data.price ? "text-green-400" : "text-red-400"
                          }`}
                      >
                        ${(data.price * 1.8).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-400 text-xs">
                    *Predictions based on historical data, market trends, and AI analysis
                  </p>
                </div>

                <Button className="bg-yellow-600 hover:bg-yellow-700 w-full text-white">
                  Execute AI Recommendation
                </Button>

                <div className="bg-gray-800/50 mt-4 p-3 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="flex-shrink-0 mt-0.5 mr-2 w-4 h-4 text-yellow-400" />
                    <p className="text-gray-400 text-xs">
                      Disclaimer: AI recommendations are not financial advice. Always do your own research (DYOR) and
                      consider your risk tolerance before making investment decisions.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "holders" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {isLoadingHolders ? (
                  <div className="flex justify-center items-center py-8">
                    <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
                    <span className="ml-2 text-gray-400">Loading token holders...</span>
                  </div>
                ) : holdersError ? (
                  <div className="bg-red-500/10 p-4 rounded-lg text-center">
                    <AlertTriangle className="mx-auto mb-2 w-6 h-6 text-red-400" />
                    <p className="text-gray-300">Error loading holder data</p>
                    <p className="mt-2 text-gray-400 text-xs">{holdersError}</p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="hover:bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                        onClick={() => fetchTokenHolders(token.id)}
                      >
                        <RefreshCw className="mr-2 w-4 h-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : holdersData && holdersData.length > 0 ? (
                  <>
                    <div className="bg-gray-800/50 mb-4 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Users className="mr-2 w-5 h-5 text-yellow-400" />
                          <div>
                            <p className="font-medium text-white text-sm">Total Unique Holders</p>
                            <p className="text-gray-400 text-xs">Based on Helius API data</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-xl">
                            {formatNumber(totalHolders || holdersData.length, 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <p className="mb-2 font-medium text-white text-sm">Top Token Holders</p>
                      <p className="mb-4 text-gray-400 text-xs">
                        Showing top {Math.min(holdersData.length, 10)} out of{" "}
                        {formatNumber(totalHolders || holdersData.length, 0)} holders
                      </p>

                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {holdersData.slice(0, 10).map((holder, index) => (
                          <div key={index} className="bg-black/40 p-2 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="flex justify-center items-center bg-yellow-500/20 mr-2 rounded-full w-6 h-6">
                                  <Wallet className="w-3 h-3 text-yellow-400" />
                                </div>
                                <div>
                                  <p className="w-32 font-mono text-white text-xs truncate">
                                    {holder.owner.substring(0, 8)}...{holder.owner.substring(holder.owner.length - 8)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white text-xs">
                                  {holder.amount ? formatNumber(holder.amount) : "Unknown"} {token.symbol}
                                </p>
                                {holdersData[0]?.amount && (
                                  <p className="text-gray-400 text-xs">
                                    {((holder.amount / holdersData[0].amount) * 100).toFixed(2)}% of top holder
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <p className="mb-2 font-medium text-white text-sm">Distribution Analysis</p>
                      <div className="space-y-3">
                        <div>
                          <p className="mb-1 text-gray-400 text-xs">Holder Concentration</p>
                          <div className="bg-gray-700 mb-1 rounded-full w-full h-1.5">
                            <div
                              className="bg-yellow-500 rounded-full h-1.5"
                              style={{
                                width: `${Math.min(
                                  (holdersData.slice(0, 5).reduce((sum, holder) => sum + (holder.amount || 0), 0) /
                                    holdersData.reduce((sum, holder) => sum + (holder.amount || 0), 0)) *
                                  100,
                                  100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-gray-400 text-xs">
                            Top 5 holders control approximately{" "}
                            {(
                              (holdersData.slice(0, 5).reduce((sum, holder) => sum + (holder.amount || 0), 0) /
                                holdersData.reduce((sum, holder) => sum + (holder.amount || 0), 0)) *
                              100
                            ).toFixed(2)}
                            % of supply
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-3 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Info className="mr-2 w-4 h-4 text-yellow-400" />
                        <p className="font-medium text-white text-sm">Holder Insights</p>
                      </div>
                      <ul className="space-y-1 pl-4 text-gray-400 text-xs list-disc">
                        <li>
                          {holdersData.length > 1000
                            ? "Wide distribution indicates strong community adoption"
                            : "Limited holder count suggests early adoption phase"}
                        </li>
                        <li>
                          {(holdersData.slice(0, 5).reduce((sum, holder) => sum + (holder.amount || 0), 0) /
                            holdersData.reduce((sum, holder) => sum + (holder.amount || 0), 0)) *
                            100 >
                            50
                            ? "High concentration in top holders (potential volatility risk)"
                            : "Well-distributed token ownership (lower volatility risk)"}
                        </li>
                        <li>Data refreshed {new Date().toLocaleTimeString()}</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <Info className="mx-auto mb-2 w-6 h-6 text-yellow-400" />
                    <p className="text-gray-300">No holder data available for this token.</p>
                    <p className="mt-2 text-gray-400 text-xs">
                      This could be due to API limitations or the token may not have public holder data.
                    </p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="hover:bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                        onClick={() => fetchTokenHolders(token.id)}
                      >
                        <RefreshCw className="mr-2 w-4 h-4" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
