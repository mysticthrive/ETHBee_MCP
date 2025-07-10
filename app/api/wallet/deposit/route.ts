import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  try {
    const { userId, amount, externalAddress, transactionHash } = await req.json()

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid request parameters" }, { status: 400 })
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ success: false, error: "Wallet not found" }, { status: 404 })
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        transaction_type: "deposit",
        amount: amount,
        external_address: externalAddress,
        transaction_hash: transactionHash,
        status: "completed",
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json({ success: false, error: "Failed to create transaction record" }, { status: 500 })
    }

    // Update wallet balance
    const newBalance = Number.parseFloat(wallet.balance) + Number.parseFloat(amount)
    const { error: updateError } = await supabase.from("wallets").update({ balance: newBalance }).eq("id", wallet.id)

    if (updateError) {
      return NextResponse.json({ success: false, error: "Failed to update wallet balance" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transaction: transaction,
      newBalance: newBalance,
    })
  } catch (error) {
    console.error("Deposit API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
