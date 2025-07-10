"use client"

import { useState } from "react"
import {
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Bot,
  User,
  Wallet,
  Settings,
  Bell,
  Shield,
  BarChart3,
  ArrowRight,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TokenChart } from "@/components/shared/token-chart"
import { BeeIcon } from "@/components/shared/bee-icon"
import { UserStatus } from "@/components/auth/user-status"
import { useIsAuthenticated, useUser, useUserWallet } from "@/store/hooks"
import { TokenTransactionHistory } from "@/components/wallet/token-transaction-history"
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form"
import Link from "next/link"
import { formatDate, formatTimeInTimezone, getUserTimezone } from "@/lib/utils/format-utils"

// Mock user token data
const mockUserTokens = [
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    amount: 12.5,
    value: 1783.38,
    price: 142.67,
    change24h: 5.23,
    color: "#14F195",
  },
  {
    id: "bonk",
    symbol: "BONK",
    name: "Bonk",
    amount: 15000000,
    value: 321.75,
    price: 0.00002145,
    change24h: 12.34,
    color: "#F7931A",
  },
  {
    id: "orca",
    symbol: "ORCA",
    name: "Orca",
    amount: 75.2,
    value: 140.62,
    price: 1.87,
    change24h: 3.45,
    color: "#1B9AF7",
  },
  {
    id: "raydium",
    symbol: "RAY",
    name: "Raydium",
    amount: 120,
    value: 414.0,
    price: 3.45,
    change24h: 2.78,
    color: "#E42575",
  },
]

// Mock AI status updates
const mockStatusUpdates = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    message:
      "SOL is showing strong momentum with a 5.23% increase in the last 24 hours. Consider holding your position.",
    type: "analysis",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    message:
      "BONK has experienced significant volatility. The token is up 12.34% in the last 24 hours, outperforming the broader market.",
    type: "alert",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    message:
      "Your portfolio has increased by 7.8% in the last 24 hours, outperforming the overall Solana ecosystem by 2.3%.",
    type: "performance",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    message: "Successfully executed limit sell order: Sold 5 SOL at $141.25.",
    type: "transaction",
  },
]

// Mock transaction history
const mockTransactions = [
  {
    id: "tx1",
    type: "buy",
    token: "SOL",
    amount: 2.5,
    price: 140.25,
    value: 350.63,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    status: "completed",
  },
  {
    id: "tx2",
    type: "sell",
    token: "BONK",
    amount: 5000000,
    price: 0.00002145,
    value: 107.25,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    status: "completed",
  },
  {
    id: "tx3",
    type: "swap",
    tokenFrom: "SOL",
    tokenTo: "ORCA",
    amountFrom: 1.2,
    amountTo: 75.2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    status: "completed",
  },
  {
    id: "tx4",
    type: "buy",
    token: "RAY",
    amount: 120,
    price: 3.25,
    value: 390.0,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
    status: "completed",
  },
]

export function DashboardContent() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedToken, setSelectedToken] = useState(mockUserTokens[0])
  const [aiUpdates, setAiUpdates] = useState(mockStatusUpdates)
  const [isGeneratingUpdate, setIsGeneratingUpdate] = useState(false)
  const [activeTab, setActiveTab] = useState("portfolio")

  // Use authentication hooks instead of wallet hooks
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const userWallet = useUserWallet()
  const timezone = user?.timezone || getUserTimezone()

  const totalValue = mockUserTokens.reduce((sum, token) => sum + token.value, 0)

  const refreshData = () => {
    setIsRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }

  const generateAiUpdate = () => {
    setIsGeneratingUpdate(true)
    // Simulate AI generating a new update
    setTimeout(() => {
      const newUpdate = {
        id: Date.now().toString(),
        timestamp: new Date(),
        message: `Based on recent market movements, ${selectedToken.symbol} is showing ${Math.random() > 0.5 ? "bullish" : "bearish"
          } signals. ${Math.random() > 0.5
            ? `Consider adding to your position if it dips below $${(selectedToken.price * 0.95).toFixed(2)}.`
            : `Monitor closely as resistance at $${(selectedToken.price * 1.05).toFixed(2)} may be tested soon.`
          }`,
        type: "analysis",
      }
      setAiUpdates([newUpdate, ...aiUpdates])
      setIsGeneratingUpdate(false)
    }, 2000)
  }

  // Show authentication prompt if not logged in
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <h2 className="mb-4 font-bold text-white text-2xl">Please Sign In</h2>
          <p className="mb-6 text-gray-400">You need to be signed in to access the dashboard.</p>
          <UserStatus variant="button" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar - Navigation and account */}
      <div className="flex flex-col bg-black/30 backdrop-blur-md p-4 border-yellow-500/10 border-r w-64">
        <div className="mb-6">
          <h2 className="flex items-center mb-4 font-semibold text-white text-lg">
            <BeeIcon className="mr-2 w-5 h-5" />
            Dashboard
          </h2>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${activeTab === "portfolio"
                ? "bg-yellow-500/20 text-yellow-400"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
            >
              <BarChart3 className="mr-3 w-4 h-4" />
              Portfolio
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${activeTab === "transactions"
                ? "bg-yellow-500/20 text-yellow-400"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
            >
              <Clock className="mr-3 w-4 h-4" />
              Transactions
            </button>

            <button
              onClick={() => setActiveTab("wallet")}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${activeTab === "wallet"
                ? "bg-yellow-500/20 text-yellow-400"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
            >
              <Wallet className="mr-3 w-4 h-4" />
              Wallet
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${activeTab === "settings"
                ? "bg-yellow-500/20 text-yellow-400"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                }`}
            >
              <Settings className="mr-3 w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>

        <div className="mt-auto">
          <div className="bg-gray-800/30 mb-4 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="flex justify-center items-center bg-yellow-500/20 mr-2 rounded-full w-8 h-8">
                <User className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">Connected User</p>
                <p className="w-40 text-gray-400 text-xs truncate">{user?.email || "user@example.com"}</p>
              </div>
            </div>
            <UserStatus variant="button" />
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1">
        {/* Center content - Portfolio/Transactions/Settings */}
        <div className="flex-1 p-4 overflow-auto">
          {activeTab === "portfolio" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-white text-xl">Portfolio Overview</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/30 text-yellow-400"
                  onClick={refreshData}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
                <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg">
                  <p className="mb-1 text-gray-400 text-sm">Total Value</p>
                  <p className="font-bold text-white text-2xl">${totalValue.toFixed(2)}</p>
                </div>
                <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg">
                  <p className="mb-1 text-gray-400 text-sm">24h Change</p>
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 w-5 h-5 text-green-400" />
                    <p className="font-bold text-green-400 text-2xl">+7.8%</p>
                  </div>
                </div>
                <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg">
                  <p className="mb-1 text-gray-400 text-sm">AI Confidence</p>
                  <div className="flex items-center">
                    <Sparkles className="mr-2 w-5 h-5 text-yellow-400" />
                    <p className="font-bold text-yellow-400 text-2xl">High</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg">
                <h3 className="mb-4 font-semibold text-white text-lg">Your Assets</h3>
                <div className="space-y-3">
                  {mockUserTokens.map((token) => (
                    <div
                      key={token.id}
                      className={`bg-black/40 rounded-lg p-3 hover:bg-gray-800/40 transition-colors cursor-pointer ${selectedToken.id === token.id ? "border border-yellow-500/30" : ""
                        }`}
                      onClick={() => setSelectedToken(token)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div
                            className="flex justify-center items-center mr-3 rounded-full w-8 h-8"
                            style={{ backgroundColor: `${token.color}20` }}
                          >
                            <span className="font-bold text-sm" style={{ color: token.color }}>
                              {token.symbol.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{token.name}</h4>
                            <p className="text-gray-400 text-xs">
                              {token.amount.toLocaleString()} {token.symbol}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">${token.value.toFixed(2)}</p>
                          <div
                            className={`flex items-center justify-end text-xs ${token.change24h >= 0 ? "text-green-400" : "text-red-400"
                              }`}
                          >
                            {token.change24h >= 0 ? (
                              <TrendingUp className="mr-1 w-3 h-3" />
                            ) : (
                              <TrendingDown className="mr-1 w-3 h-3" />
                            )}
                            <span>
                              {token.change24h >= 0 ? "+" : ""}
                              {token.change24h}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-white text-lg">
                    {selectedToken.name} ({selectedToken.symbol}) Chart
                  </h3>
                  <div className="flex items-center text-sm">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      1D
                    </Button>
                    <Button variant="ghost" size="sm" className="bg-gray-800/50 text-white">
                      1W
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      1M
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      1Y
                    </Button>
                  </div>
                </div>
                <div className="h-64">
                  <TokenChart tokenId={selectedToken.id} color={selectedToken.color} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div>
              <h2 className="mb-4 font-bold text-white text-xl">Transaction History</h2>

              {/* Supabase Token and Transaction History */}
              <div className="mb-6">
                <TokenTransactionHistory />
              </div>

              {/* Legacy Mock Transactions */}
              <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg">
                <h3 className="mb-4 font-semibold text-white text-lg">Sample Transactions</h3>
                <div className="space-y-3">
                  {mockTransactions.map((tx) => (
                    <div key={tx.id} className="bg-black/40 hover:bg-gray-800/40 p-3 rounded-lg transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full mr-3 flex items-center justify-center ${tx.type === "buy"
                              ? "bg-green-500/20"
                              : tx.type === "sell"
                                ? "bg-red-500/20"
                                : "bg-blue-500/20"
                              }`}
                          >
                            {tx.type === "buy" && <TrendingUp className="w-4 h-4 text-green-400" />}
                            {tx.type === "sell" && <TrendingDown className="w-4 h-4 text-red-400" />}
                            {tx.type === "swap" && <ArrowRight className="w-4 h-4 text-blue-400" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-white capitalize">{tx.type}</h4>
                            <p className="text-gray-400 text-xs">
                              {tx.type === "swap"
                                ? `${tx.amountFrom} ${tx.tokenFrom} → ${tx.amountTo} ${tx.tokenTo}`
                                : `${tx.amount} ${tx.token}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {tx.type !== "swap" && tx.value !== undefined && (
                            <p className="font-medium text-white">${tx.value.toFixed(2)}</p>
                          )}
                          <p className="text-gray-400 text-xs">
                            {formatDate(tx.timestamp.toISOString ? tx.timestamp.toISOString() : tx.timestamp, true, timezone)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "wallet" && (
            <div>
              <h2 className="mb-4 font-bold text-white text-xl">Wallet Information</h2>
              <div className="bg-black/30 backdrop-blur-md mb-4 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="flex justify-center items-center bg-yellow-500/20 mr-3 rounded-full w-10 h-10">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-lg">Built-in Wallet</h3>
                    <p className="text-gray-400 text-sm truncate">{userWallet?.address || "Loading wallet..."}</p>
                  </div>
                </div>

                <div className="gap-4 grid grid-cols-1 md:grid-cols-2 mb-4">
                  <div className="bg-black/40 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">Total Balance</p>
                    <p className="font-bold text-white text-lg">
                      {userWallet?.balance ? `${userWallet.balance} SOL` : "$0.00"}
                    </p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg">
                    <p className="mb-1 text-gray-400 text-xs">Wallet Created</p>
                    <p className="font-bold text-white text-lg">
                      {userWallet?.created_at ? formatDate(userWallet.created_at, false, timezone) : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href="/wallet/deposit">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Download className="mr-2 w-4 h-4" />
                      Deposit
                    </Button>
                  </Link>
                  <Link href="/wallet/withdraw">
                    <Button size="sm" variant="outline" className="hover:bg-red-500/10 border-red-500/30 text-red-400">
                      <Upload className="mr-2 w-4 h-4" />
                      Withdraw
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-400">
                    View on Explorer
                  </Button>
                </div>
              </div>

              <div className="bg-black/30 backdrop-blur-md p-4 rounded-lg">
                <h3 className="mb-3 font-semibold text-white text-lg">Security</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                    <div className="flex items-center">
                      <Shield className="mr-3 w-5 h-5 text-yellow-400" />
                      <span className="text-white">Private Key Security</span>
                    </div>
                    <span className="text-green-400 text-sm">Encrypted</span>
                  </div>

                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="mr-3 w-5 h-5 text-yellow-400" />
                      <span className="text-white">Transaction Notifications</span>
                    </div>
                    <span className="text-green-400 text-sm">Enabled</span>
                  </div>

                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg">
                    <div className="flex items-center">
                      <Settings className="mr-3 w-5 h-5 text-yellow-400" />
                      <span className="text-white">Daily Spending Limit</span>
                    </div>
                    <span className="text-gray-400 text-sm">$5,000</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              <h2 className="mb-4 font-bold text-white text-xl">Account Settings</h2>
              <ProfileSettingsForm />
            </div>
          )}
        </div>

        {/* Right sidebar - AI updates */}
        <div className="bg-black/30 backdrop-blur-md border-yellow-500/10 border-l w-80">
          <div className="flex justify-between items-center p-4 border-yellow-500/20 border-b">
            <div className="flex items-center">
              <BeeIcon className="mr-2 w-5 h-5" />
              <h3 className="font-medium text-white">AI Insights</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-500/50 text-yellow-400 text-xs"
              onClick={generateAiUpdate}
              disabled={isGeneratingUpdate}
            >
              <Sparkles className="mr-1 w-3 h-3" />
              {isGeneratingUpdate ? "Analyzing..." : "Generate"}
            </Button>
          </div>

          <div className="flex items-center bg-yellow-600/10 px-4 py-2 border-yellow-500/20 border-b text-yellow-200 text-xs">
            <AlertTriangle className="flex-shrink-0 mr-2 w-3 h-3" />
            <span>AI insights are for informational purposes only.</span>
          </div>

          <div className="p-4 overflow-y-auto" style={{ height: "calc(100vh - 200px)" }}>
            {isGeneratingUpdate && (
              <div className="flex items-center bg-black/40 mb-4 p-3 rounded-lg animate-pulse">
                <Bot className="mr-3 w-5 h-5 text-yellow-400" />
                <span className="text-gray-400">Analyzing market data...</span>
              </div>
            )}

            {aiUpdates.map((update) => (
              <div key={update.id} className="mb-4 last:mb-0">
                <div className="flex items-center mb-1">
                  <Bot className="mr-2 w-4 h-4 text-yellow-400" />
                  <span className="text-gray-400 text-xs">
                    {formatTimeInTimezone(new Date(update.timestamp), timezone, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="bg-black/40 p-3 border-yellow-500 border-l-2 rounded-lg">
                  <p className="text-gray-200 text-sm">{update.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
