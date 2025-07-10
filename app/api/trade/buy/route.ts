import { NextResponse } from "next/server"
import { saveTransactionData } from "@/lib/services/supabase-transaction-service"
import { getUserFromBody } from "@/lib/middleware/auth-middleware"
import { supabaseAdmin } from "@/lib/supabase/client"
import { Keypair } from "@solana/web3.js"
import { getUserPrivateKey } from "@/lib/services/wallet-generation-service"
import { TradingService, TOKENS } from "@/lib/services/trading-service"

export async function POST(req: Request) {
  try {
    const {
      user_id,
      token_address,
      token_symbol,
      amount,
      price_type = "market",
      limit_price
    } = await req.json()

    console.log("Buy trade request:", { user_id, token_address, token_symbol, amount, price_type, limit_price })

    // Validate required fields
    if (!user_id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    if (!amount || parseFloat(amount.toString()) <= 0) {
      return NextResponse.json({ success: false, error: "Valid amount is required" }, { status: 400 })
    }

    // Get user and wallet information from database
    const { user, error: userError } = await getUserFromBody(user_id)
    if (userError || !user) {
      return NextResponse.json({ success: false, error: userError || "User not found" }, { status: 400 })
    }

    // Get user's private key
    const userKeypair = await getUserPrivateKey(user_id)
    if (!userKeypair) {
      return NextResponse.json({ success: false, error: "Failed to get user's private key" }, { status: 400 })
    }

    // Get token info
    const finalTokenSymbol = token_symbol || "SOL"
    const finalTokenAddress = token_address || (TOKENS[finalTokenSymbol as keyof typeof TOKENS] || TOKENS.SOL)

    console.log("🔴finalTokenAddress");
    console.log(finalTokenAddress);

    // Initialize trading service
    const tradingService = new TradingService();

    // Execute the swap
    const result = await tradingService.executeSwap({
      inputMint: TOKENS.SOL, // Assuming user is paying with SOL
      outputMint: finalTokenAddress,
      amount: amount.toString(),
      slippageBps: "50", // 0.5% slippage
      swapMode: "ExactOut",
      wallet: userKeypair
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: `Failed to execute swap: ${result.error}` }, { status: 400 })
    }

    console.log("😍 result");
    console.log(result);

    // Store transaction data in Supabase
    try {
      await saveTransactionData({
        tx_hash: result.data.signature,
        user_wallet: user.wallet_address,
        action_type: "buy",
        token_address: finalTokenAddress,
        token_symbol: finalTokenSymbol,
        in_amount: result.data?.quote?.inAmount,
        out_amount: result.data?.quote?.outAmount,
        swap_usd_value: result.data?.quote?.swapUsdValue * 1000000,
        status: "success",
        details: {
          price_type,
          limit_price,
          user_id: user.id,
          wallet_id: user.wallet_id,
          quote: result.data.quote,
          swap: result.data
        },
      }, user_id)
    } catch (error) {
      console.error("Error saving transaction data:", error)
    }

    return NextResponse.json({
      success: true,
      tx_hash: result.data.signature,
      message: `Successfully purchased ${amount} ${finalTokenSymbol}`,
      user_wallet: user.wallet_address,
      token_info: {
        symbol: finalTokenSymbol,
        address: finalTokenAddress,
      },
      executed_action: {
        type: "buy",
        asset: finalTokenSymbol,
        out_amount: Number.parseFloat(amount),
        in_amount: Number.parseFloat(result.data?.quote?.inAmount) / 1000000000,
        success: true,
        txHash: result.data.signature,
        price: result.data?.quote?.swapUsdValue,
        priceType: price_type,
        limitPrice: limit_price,
      },
    })
  } catch (error) {
    console.error("Error in buy trade API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
