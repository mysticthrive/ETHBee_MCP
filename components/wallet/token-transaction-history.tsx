"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/utils"
import { TokenData, TransactionData } from "@/lib/types/database"
import { useAppSelector } from "@/store/hooks"
import { getTransactionsByUserId } from "@/lib/services/supabase-transaction-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, Info, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { getUserTimezone, formatTimeAgo, formatDate } from "@/lib/utils/format-utils"

export function TokenTransactionHistory() {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("tokens")
  const user = useAppSelector((state) => state.auth.user)
  const timezone = user?.timezone || getUserTimezone()

  const fetchData = async () => {
    if (!user?.id) {
      console.log("No user ID available")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      // Fetch tokens
      const { data: tokensData, error: tokensError } = await supabase
        .from("tokens")
        .select("*")
        .order("created_at", { ascending: false })

      if (tokensError) throw tokensError
      setTokens(tokensData || [])

      // Fetch transactions using user ID
      const { data: transactionsData, error: transactionsError } = await getTransactionsByUserId(user.id)

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError)
        throw new Error(transactionsError)
      }

      setTransactions(transactionsData || [])
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  // Format price with appropriate precision
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return "N/A"

    if (price < 0.0001) return "$" + price.toExponential(2)
    if (price < 0.01) return "$" + price.toFixed(6)
    if (price < 1) return "$" + price.toFixed(4)
    if (price < 1000) return "$" + price.toFixed(2)
    return "$" + price.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  // Get appropriate icon and color for transaction type
  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case "buy":
        return { icon: <ArrowDownRight className="w-4 h-4 text-green-500" />, color: "bg-green-500/10 text-green-500" }
      case "sell":
        return { icon: <ArrowUpRight className="w-4 h-4 text-red-500" />, color: "bg-red-500/10 text-red-500" }
      case "swap":
        return { icon: <RefreshCw className="w-4 h-4 text-blue-500" />, color: "bg-blue-500/10 text-blue-500" }
      case "check_balance":
        return { icon: <Info className="w-4 h-4 text-yellow-500" />, color: "bg-yellow-500/10 text-yellow-500" }
      case "set_alert":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-purple-500" />,
          color: "bg-purple-500/10 text-purple-500",
        }
      case "info":
        return { icon: <Info className="w-4 h-4 text-blue-500" />, color: "bg-blue-500/10 text-blue-500" }
      default:
        return { icon: <Info className="w-4 h-4" />, color: "bg-gray-500/10 text-gray-500" }
    }
  }

  // Format transaction status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/20 hover:bg-green-500/30 text-green-500">Success</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-500/20 hover:bg-red-500/30 text-red-500">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Token & Transaction History</CardTitle>
        <CardDescription>View your token data and transaction history</CardDescription>
      </CardHeader>
      <CardContent>
        {!getSupabaseClient() ? (
          <div className="py-8 text-muted-foreground text-center">
            <AlertTriangle className="mx-auto mb-2 w-8 h-8 text-yellow-500" />
            <p className="mb-2 font-medium">Supabase connection is not configured</p>
            <p>Please check your environment variables to ensure Supabase URL and API keys are properly set.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="tokens" className="mt-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                    </div>
                  ) : tokens.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>24h Change</TableHead>
                            <TableHead>Last Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokens.map((token) => (
                            <TableRow key={token.id}>
                              <TableCell className="font-medium">{token.symbol}</TableCell>
                              <TableCell>{token.name}</TableCell>
                              <TableCell>{formatPrice(token.price_usd)}</TableCell>
                              <TableCell>
                                {token.price_change_24h !== undefined && token.price_change_24h !== null ? (
                                  <span className={token.price_change_24h >= 0 ? "text-green-500" : "text-red-500"}>
                                    {token.price_change_24h >= 0 ? "+" : ""}
                                    {token.price_change_24h.toFixed(2)}%
                                  </span>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell>{token.updated_at ? formatTimeAgo(token.updated_at, timezone) : "N/A"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-muted-foreground text-center">
                      No token data available. Try interacting with tokens in the AI chat.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                    </div>
                  ) : transactions.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Token</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((tx) => {
                            const typeInfo = getTransactionTypeInfo(tx.action_type)
                            const token = tokens.find((t) => t.address === tx.token_address)
                            return (
                              <TableRow key={tx.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Badge variant="outline" className={`mr-2 ${typeInfo.color}`}>
                                      <span className="mr-1">{typeInfo.icon}</span>
                                      <span className="capitalize">{tx.action_type.replace("_", " ")}</span>
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">{token?.symbol || tx.token_symbol}</TableCell>
                                <TableCell>
                                  {tx.in_amount ? `${tx.in_amount} ${token?.symbol || ""}` : ""}
                                  {tx.out_amount ? `${tx.out_amount} ${token?.symbol || ""}` : ""}
                                </TableCell>
                                <TableCell>{formatPrice(tx.swap_usd_value)}</TableCell>
                                <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                <TableCell>{tx.created_at ? formatTimeAgo(tx.created_at, timezone) : "N/A"}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-muted-foreground text-center">
                      {user?.id
                        ? "No transactions found. Try executing some actions in the AI chat."
                        : "Sign in to view your transactions."}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  setError(null)
                }}
                disabled={loading}
                className="flex items-center"
              >
                {loading ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : <RefreshCw className="mr-2 w-4 h-4" />}
                Refresh
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
