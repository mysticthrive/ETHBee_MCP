"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Download, Upload, Wallet, Eye, EyeOff } from "lucide-react"
import { useUser, useUserWallet, useAuthActions } from "@/store/hooks"

export function WalletManagement() {
  const user = useUser()
  const wallet = useUserWallet()
  const { updateWalletBalance } = useAuthActions()

  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [showAddress, setShowAddress] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
        setMessage({ type: "success", text: `Successfully deposited ${depositAmount} SOL` })
      } else {
        setMessage({ type: "error", text: result.error || "Deposit failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred during deposit" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!user || !wallet || !withdrawAmount || !withdrawAddress) return

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          amount: Number.parseFloat(withdrawAmount),
          externalAddress: withdrawAddress,
        }),
      })

      const result = await response.json()

      if (result.success) {
        updateWalletBalance(result.newBalance)
        setWithdrawAmount("")
        setWithdrawAddress("")
        setMessage({ type: "success", text: `Successfully withdrew ${withdrawAmount} SOL` })
      } else {
        setMessage({ type: "error", text: result.error || "Withdrawal failed" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred during withdrawal" })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: "success", text: "Copied to clipboard!" })
    setTimeout(() => setMessage(null), 2000)
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No wallet found. Please sign in.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Your Wallet
          </CardTitle>
          <CardDescription>Manage your Solana wallet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Balance</Label>
              <p className="text-2xl font-bold">{wallet.balance.toFixed(4)} SOL</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Wallet Address</Label>
            <div className="flex items-center gap-2">
              <Input
                value={
                  showAddress
                    ? wallet.wallet_address
                    : `${wallet.wallet_address.slice(0, 8)}...${wallet.wallet_address.slice(-8)}`
                }
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => setShowAddress(!showAddress)}>
                {showAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(wallet.wallet_address)}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Deposit SOL
              </CardTitle>
              <CardDescription>Add SOL to your wallet (Demo)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount (SOL)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleDeposit} disabled={!depositAmount || isLoading} className="w-full">
                {isLoading ? "Processing..." : "Deposit SOL"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Withdraw SOL
              </CardTitle>
              <CardDescription>Send SOL to external address (Demo)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount (SOL)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-address">Destination Address</Label>
                <Input
                  id="withdraw-address"
                  placeholder="Enter Solana address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                />
              </div>
              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || !withdrawAddress || isLoading}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Withdraw SOL"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
