import { NextResponse } from "next/server"
import { getTokenPrice, getTokenMarketData } from "@/lib/services/token-service"
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils"

export async function POST(req: Request) {
  try {
    const { tokenAddress, symbol } = await req.json()

    if (!tokenAddress && !symbol) {
      return NextResponse.json({ error: "Either tokenAddress or symbol is required" }, { status: 400 })
    }

    console.log(`API: Getting price for token: ${tokenAddress || symbol}`)

    // Get token price
    const price = await getTokenPrice(tokenAddress, symbol)

    // Get market data
    const marketData = await getTokenMarketData(tokenAddress, symbol)

    if (!price && !marketData) {
      return NextResponse.json(
        {
          error: "Could not retrieve price or market data for the specified token",
          message: "The token may not be listed on major exchanges or may have low liquidity",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      price,
      marketData,
      note: "Social stats, security scores, and recommendations are not available from APIs and will be simulated in the UI.",
    })
  } catch (error) {
    logError(error, "token/price API", {
      tokenAddress: req.body?.tokenAddress,
      symbol: req.body?.symbol,
    })

    return NextResponse.json(
      {
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
