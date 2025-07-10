"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useUser } from "@/store/hooks"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LimitOrder } from "@/lib/types/limit-order-types";
import { formatCurrency, formatDate, getUserTimezone } from "@/lib/utils/format-utils"
import { AlertCircle, CheckCircle, Clock, X } from "lucide-react"
import { toast } from "sonner"

export function LimitOrdersTable() {
  const { publicKey } = useWallet()
  const user = useUser()
  const timezone = user?.timezone || getUserTimezone()
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (publicKey) {
      fetchOrders()
    } else {
      setOrders([])
      setLoading(false)
    }
  }, [publicKey])

  const fetchOrders = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const response = await fetch("/api/limit-orders/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_wallet: publicKey.toString(),
        }),
      })

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setOrders(result.data)
      } else {
        console.error("Failed to fetch limit orders:", result.error)
        toast.error("Failed to load your limit orders")
      }
    } catch (error) {
      console.error("Error fetching limit orders:", error)
      toast.error("Error loading your limit orders")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!publicKey) return

    setCancelling(orderId)
    try {
      const response = await fetch("/api/limit-orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          user_wallet: publicKey.toString(),
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success("Limit order cancelled successfully")
        // Update the order in the local state
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ))
      } else {
        console.error("Failed to cancel limit order:", result.error)
        toast.error(`Failed to cancel order: ${result.error}`)
      }
    } catch (error) {
      console.error("Error cancelling limit order:", error)
      toast.error("Error cancelling your order")
    } finally {
      setCancelling(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/50 text-yellow-400"><Clock className="mr-1 w-3 h-3" /> Pending</Badge>
      case 'executed':
        return <Badge variant="outline" className="bg-green-500/20 border-green-500/50 text-green-400"><CheckCircle className="mr-1 w-3 h-3" /> Executed</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/20 border-gray-500/50 text-gray-400"><X className="mr-1 w-3 h-3" /> Cancelled</Badge>
      default:
        return <Badge variant="outline"><AlertCircle className="mr-1 w-3 h-3" /> {status}</Badge>
    }
  }

  if (!publicKey) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">Connect your wallet to view your limit orders</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">Loading your limit orders...</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">You don't have any limit orders yet</p>
      </div>
    )
  }

  return (
    <div className="border border-yellow-500/20 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-black/40 hover:bg-black/40">
            <TableHead className="text-yellow-400">Type</TableHead>
            <TableHead className="text-yellow-400">Token</TableHead>
            <TableHead className="text-yellow-400">Amount</TableHead>
            <TableHead className="text-yellow-400">Limit Price</TableHead>
            <TableHead className="text-yellow-400">Status</TableHead>
            <TableHead className="text-yellow-400">Created</TableHead>
            <TableHead className="text-yellow-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="hover:bg-yellow-500/5 border-yellow-500/10">
              <TableCell className="font-medium capitalize">
                {order.action_type}
              </TableCell>
              <TableCell>{order.token_symbol}</TableCell>
              <TableCell>{order.amount}</TableCell>
              <TableCell>{formatCurrency(order.limit_price)}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>{formatDate(order.created_at, true, timezone)}</TableCell>
              <TableCell>
                {order.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-red-500/10 border-red-500/30 text-red-400"
                    onClick={() => handleCancelOrder(order.id!)}
                    disabled={cancelling === order.id}
                  >
                    {cancelling === order.id ? 'Cancelling...' : 'Cancel'}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
