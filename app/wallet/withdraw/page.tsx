"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload, Wallet, AlertTriangle, CheckCircle } from "lucide-react"
import { useIsAuthenticated, useUser, useUserWallet, useAuthActions } from "@/store/hooks"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"

export default function WithdrawPage() {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const wallet = useUserWallet()
  const { updateWalletBalance } = useAuthActions()

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
    }
  }, [isAuthenticated, router])

  const handleWithdraw = async () => {
    if (!user || !wallet || !withdrawAmount || !withdrawAddress) return

    // Validate amount
    const amount = Number.parseFloat(withdrawAmount)
    if (amount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" })
      return
    }

    if (amount > wallet.balance) {
      setMessage({ type: "error", text: "Insufficient balance" })
      return
    }

    // Basic Solana address validation
    if (withdrawAddress.length < 32 || withdrawAddress.length > 44) {
      setMessage({ type: "error", text: "Please enter a valid Solana address" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: amount,
          externalAddress: withdrawAddress,
        }),
      })

      const result = await response.json()

      if (result.success) {
        updateWalletBalance(result.newBalance)
        setWithdrawAmount("")
        setWithdrawAddress("")
        setMessage({
          type: "success",
          text: `Successfully withdrew ${amount} SOL to ${withdrawAddress.slice(0, 8)}...${withdrawAddress.slice(-8)}`,
        })
      } else {
        setMessage({ type: "error", text: result.error || "Withdrawal failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred during withdrawal" })
    } finally {
      setIsLoading(false)
    }
  }

  const setMaxAmount = () => {
    if (wallet) {
      // Leave a small amount for transaction fees
      const maxAmount = Math.max(0, wallet.balance - 0.001)
      setWithdrawAmount(maxAmount.toString())
    }
  }

  if (!isAuthenticated || !wallet) {
    return (
      <div className="bg-grid-white/[0.02] bg-black/[0.96] min-h-screen antialiased">
        <Navbar />
        <div className="px-6 pt-24">
          <div className="mx-auto max-w-md">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">Please sign in to access your wallet.</p>
                <Button className="mt-4" onClick={() => router.push("/auth")}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-grid-white/[0.02] bg-black/[0.96] min-h-screen antialiased">
      <Navbar />

      <div className="px-6 pt-24 pb-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center mb-4 text-yellow-400 hover:text-yellow-300">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="mb-2 font-bold text-white text-3xl">Withdraw SOL</h1>
            <p className="text-gray-400">Send SOL from your EthBee wallet to external address</p>
          </div>

          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="gap-6 grid md:grid-cols-2">
            {/* Wallet Info */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="w-5 h-5 text-yellow-400" />
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-500/10 p-4 border border-yellow-500/30 rounded-lg">
                  <Label className="font-medium text-gray-300 text-sm">Current Balance</Label>
                  <p className="font-bold text-white text-2xl">{wallet.balance.toFixed(4)} SOL</p>
                </div>

                <div className="bg-orange-500/10 p-3 border border-orange-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="flex-shrink-0 mt-0.5 w-4 h-4 text-orange-400" />
                    <div className="text-orange-300 text-sm">
                      <p className="font-medium">Transaction Fees</p>
                      <p className="text-orange-400 text-xs">Small network fees may apply for Solana transactions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdraw Form */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="w-5 h-5 text-red-400" />
                  Withdraw SOL
                </CardTitle>
                <CardDescription className="text-gray-400">Send SOL to external Solana address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-address" className="text-gray-300">
                    Destination Address
                  </Label>
                  <Input
                    id="withdraw-address"
                    placeholder="Enter Solana wallet address"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    className="bg-gray-800 border-gray-700 font-mono text-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="withdraw-amount" className="text-gray-300">
                      Amount (SOL)
                    </Label>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={setMaxAmount}
                      className="p-0 h-auto text-yellow-400 hover:text-yellow-300"
                    >
                      Max
                    </Button>
                  </div>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="gap-2 grid grid-cols-3">
                  {["0.1", "0.5", "1.0"].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawAmount(amount)}
                      disabled={Number.parseFloat(amount) > wallet.balance}
                      className="hover:bg-gray-800 disabled:opacity-50 border-gray-700 text-gray-300"
                    >
                      {amount} SOL
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount ||
                    !withdrawAddress ||
                    isLoading ||
                    Number.parseFloat(withdrawAmount) > wallet.balance
                  }
                  className="bg-red-600 hover:bg-red-700 w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 w-4 h-4" />
                      Withdraw SOL
                    </>
                  )}
                </Button>

                <div className="bg-blue-500/10 p-3 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="flex-shrink-0 mt-0.5 w-4 h-4 text-blue-400" />
                    <div className="text-blue-300 text-sm">
                      <p className="font-medium">Demo Mode</p>
                      <p className="text-blue-400 text-xs">
                        This is a demo withdrawal. In production, SOL would be sent to the specified address.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Card className="bg-red-900/20 mt-6 border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Security Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <div className="space-y-2 text-sm">
                <p>• Double-check the destination address before confirming</p>
                <p>• Solana transactions are irreversible once confirmed</p>
                <p>• Always send a small test amount first for new addresses</p>
                <p>• Keep some SOL in your wallet for future transaction fees</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
