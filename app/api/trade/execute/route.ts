import { NextRequest, NextResponse } from "next/server"
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils"
import { getSupabaseClient } from "@/lib/supabase/utils"
import { getUserFromBody } from "@/lib/middleware/auth-middleware"
import { TransactionData } from "@/lib/types/database"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const {
      user_id,
      token_address,
      token_symbol,
      action_type,
      amount,
      price,
      order_id,
      price_type = "market",
      limit_price,
    } = await request.json()

    // Validate required fields based on action type
    if (!user_id || !action_type || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: user_id, action_type, amount",
        },
        { status: 400 },
      )
    }

    // Get user and wallet information from database
    const { user, error: userError } = await getUserFromBody(user_id)
    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: userError || "User not found",
        },
        { status: 400 },
      )
    }

    // Validate fields specific to action type
    if (action_type === "buy" || action_type === "sell") {
      if (!token_address || !token_symbol) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields for buy/sell: token_address, token_symbol",
          },
          { status: 400 },
        )
      }
    }

    console.log(
      `API: Executing ${action_type} trade for ${amount} ${token_symbol} ${price ? `at $${price}` : ""} for user ${user.email}`,
    )

    // Simulate trade execution with 80% success rate (same as frontend)
    const tradeSuccess = Math.random() > 0.2

    if (!tradeSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: "Trade execution failed due to network congestion or insufficient funds",
          simulated: true,
        },
        { status: 400 },
      )
    }

    // Generate a transaction hash
    const tx_hash = `${action_type}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

    // Prepare transaction data
    const transactionData: TransactionData = {
      user_wallet: user.wallet_address,
      action_type,
      token_address,
      token_symbol,
      status: "pending",
      tx_hash,
      in_amount: action_type === "buy" ? Number.parseFloat(amount) : undefined,
      out_amount: action_type === "sell" ? Number.parseFloat(amount) : undefined,
      swap_usd_value: price || limit_price,
      details: {
        execution_type: order_id ? "limit_order" : "market_order",
        price_type,
        execution_price: price,
        limit_price,
        order_id,
        user_id: user.id,
        wallet_id: user.wallet_id,
      },
    }

    // Record the transaction in the database
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single()

    if (txError) {
      console.error("Error recording transaction:", txError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to record transaction: ${txError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      tx_hash,
      transaction,
      action_type,
      amount: Number.parseFloat(amount),
      price: price || limit_price,
      price_type,
      user_wallet: user.wallet_address,
      message: `Successfully executed ${action_type} for ${amount} ${token_symbol}`,
    })
  } catch (error) {
    logError(error, "trade/execute API")

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
