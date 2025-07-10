"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Download, Copy, QrCode, Wallet, CheckCircle } from "lucide-react"
import { useIsAuthenticated, useUser, useUserWallet, useAuthActions } from "@/store/hooks"
import Navbar from "@/components/layout/navbar"
import Link from "next/link"

export default function DepositPage() {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()
  const user = useUser()
  const wallet = useUserWallet()
  const { updateWalletBalance } = useAuthActions()

  const [depositAmount, setDepositAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
    }
  }, [isAuthenticated, router])

  const handleDeposit = async () => {
    if (!user || !wallet || !depositAmount) return

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: Number.parseFloat(depositAmount),
          externalAddress: "demo-external-address",
          transactionHash: `demo-${Date.now()}`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        updateWalletBalance(result.newBalance)
        setDepositAmount("")
        setMessage({
          type: "success",
          text: `Successfully deposited ${depositAmount} SOL to your wallet!`,
        })
      } else {
        setMessage({ type: "error", text: result.error || "Deposit failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred during deposit" })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "Address copied to clipboard!" })
    setTimeout(() => setMessage(null), 2000)
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
            <h1 className="mb-2 font-bold text-white text-3xl">Deposit SOL</h1>
            <p className="text-gray-400">Add SOL to your EthBee wallet</p>
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
                  Your Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-500/10 p-4 border border-yellow-500/30 rounded-lg">
                  <Label className="font-medium text-gray-300 text-sm">Current Balance</Label>
                  <p className="font-bold text-white text-2xl">{wallet.balance.toFixed(4)} SOL</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-gray-300 text-sm">Wallet Address</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${wallet.wallet_address.slice(0, 12)}...${wallet.wallet_address.slice(-12)}`}
                      readOnly
                      className="bg-gray-800 border-gray-700 font-mono text-gray-300 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(wallet.wallet_address)}
                      className="hover:bg-gray-800 border-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowQR(!showQR)}
                  className="hover:bg-gray-800 border-gray-700 w-full"
                >
                  <QrCode className="mr-2 w-4 h-4" />
                  {showQR ? "Hide" : "Show"} QR Code
                </Button>

                {showQR && (
                  <div className="bg-white p-4 rounded-lg text-center">
                    <div className="flex justify-center items-center bg-gray-200 mx-auto rounded-lg w-32 h-32">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="mt-2 text-gray-600 text-xs">QR Code for wallet address</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deposit Form */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Download className="w-5 h-5 text-green-400" />
                  Quick Deposit
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Demo deposit - Add SOL to your wallet instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount" className="text-gray-300">
                    Amount (SOL)
                  </Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.0001"
                    placeholder="0.0000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="gap-2 grid grid-cols-3">
                  {["0.1", "0.5", "1.0"].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(amount)}
                      className="hover:bg-gray-800 border-gray-700 text-gray-300"
                    >
                      {amount} SOL
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={!depositAmount || isLoading}
                  className="bg-green-600 hover:bg-green-700 w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 border-2 border-white/30 border-t-white rounded-full w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 w-4 h-4" />
                      Deposit SOL
                    </>
                  )}
                </Button>

                <div className="bg-blue-500/10 p-3 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="flex-shrink-0 mt-0.5 w-4 h-4 text-blue-400" />
                    <div className="text-blue-300 text-sm">
                      <p className="font-medium">Demo Mode</p>
                      <p className="text-blue-400 text-xs">
                        This is a demo deposit. In production, you would send SOL to your wallet address.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="bg-gray-900/50 mt-6 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">How to Deposit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <div className="flex flex-shrink-0 justify-center items-center bg-yellow-500 rounded-full w-6 h-6 font-bold text-black text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium">Copy your wallet address</p>
                  <p className="text-gray-400 text-sm">Use the copy button to get your unique wallet address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-shrink-0 justify-center items-center bg-yellow-500 rounded-full w-6 h-6 font-bold text-black text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium">Send SOL from external wallet</p>
                  <p className="text-gray-400 text-sm">Transfer SOL from Phantom, Solflare, or any Solana wallet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-shrink-0 justify-center items-center bg-yellow-500 rounded-full w-6 h-6 font-bold text-black text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium">Wait for confirmation</p>
                  <p className="text-gray-400 text-sm">Your balance will update once the transaction is confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
