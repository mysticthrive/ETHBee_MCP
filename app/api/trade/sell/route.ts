import { NextResponse } from "next/server"
import { saveTransactionData } from "@/lib/services/supabase-transaction-service"
import { getUserFromBody } from "@/lib/middleware/auth-middleware"
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

    console.log("Sell trade request:", { user_id, token_address, token_symbol, amount, price_type, limit_price })

    // Validate required fields
    if (!user_id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    if (!amount || amount <= 0) {
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
      inputMint: finalTokenAddress, // User is selling the token
      outputMint: TOKENS.SOL, // Converting to SOL
      amount: amount.toString(),
      slippageBps: "50", // 0.5% slippage
      swapMode: "ExactIn",
      wallet: userKeypair
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: "Failed to execute swap" }, { status: 400 })
    }

    // Get quote data for price calculation
    const quoteResult = await tradingService.getQuote({
      inputMint: finalTokenAddress,
      outputMint: TOKENS.SOL,
      amount: amount.toString(),
      swapMode: "ExactIn"
    });

    if (!quoteResult.success) {
      return NextResponse.json({ success: false, error: "Failed to get quote for price calculation" }, { status: 400 })
    }

    const price = Number(quoteResult.data.inAmount) / Number(quoteResult.data.outAmount);

    // Store transaction data in Supabase
    try {
      await saveTransactionData({
        tx_hash: result.data.signature,
        user_wallet: user.wallet_address,
        action_type: "sell",
        token_address: finalTokenAddress,
        token_symbol: finalTokenSymbol,
        out_amount: Number.parseFloat(amount),
        swap_usd_value: price,
        status: "success",
        details: {
          price_type,
          limit_price,
          user_id: user.id,
          wallet_id: user.wallet_id,
          quote: quoteResult.data,
          swap: result.data
        },
      }, user_id)
    } catch (error) {
      console.error("Error saving transaction data:", error)
    }

    return NextResponse.json({
      success: true,
      tx_hash: result.data.signature,
      message: `Successfully sold ${amount} ${finalTokenSymbol}`,
      user_wallet: user.wallet_address,
      token_info: {
        symbol: finalTokenSymbol,
        address: finalTokenAddress,
        price: price
      },
      executed_action: {
        type: "sell",
        asset: finalTokenSymbol,
        amount: Number.parseFloat(amount),
        success: true,
        txHash: result.data.signature,
        price: price,
        priceType: price_type,
        limitPrice: limit_price,
      },
    })
  } catch (error) {
    console.error("Error in sell trade API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
