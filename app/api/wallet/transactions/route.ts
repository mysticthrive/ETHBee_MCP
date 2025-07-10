import { NextResponse } from "next/server"
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils"
import { getWalletTransactions } from "@/lib/services/wallet-service"
import { getUserFromBody } from "@/lib/middleware/auth-middleware"

export async function POST(req: Request) {
  try {
    const { user_id, limit = 50, transaction_type, token_symbol } = await req.json()

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: user_id",
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

    console.log(`API: Fetching wallet transactions for user ${user.email} (${user.wallet_address})`)

    const transactions = await getWalletTransactions(user.wallet_address, limit, transaction_type, token_symbol)

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
      user_wallet: user.wallet_address,
    })
  } catch (error) {
    logError(error, "wallet/transactions API")

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
