import { NextResponse } from "next/server"
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils"

export async function POST(req: Request) {
  try {
    const { tokenAddress } = await req.json()

    if (!tokenAddress) {
      return NextResponse.json({ error: "Token address is required" }, { status: 400 })
    }

    console.log(`API: Getting Jupiter data for token: ${tokenAddress}`)

    // Fetch token data from Jupiter API
    const jupiterUrl = `https://lite-api.jup.ag/tokens/v1/token/${tokenAddress}`

    const jupiterResponse = await fetch(jupiterUrl)

    if (!jupiterResponse.ok) {
      return NextResponse.json(
        { error: `Jupiter API returned status ${jupiterResponse.status}` },
        { status: jupiterResponse.status },
      )
    }

    const jupiterData = await jupiterResponse.json()

    // Get price data from CoinGecko if coingeckoId is available
    let priceData = null
    if (jupiterData.extensions && jupiterData.extensions.coingeckoId) {
      try {
        const coingeckoId = jupiterData.extensions.coingeckoId
        const cgResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`,
        )

        if (cgResponse.ok) {
          const cgData = await cgResponse.json()
          if (cgData[coingeckoId]) {
            priceData = {
              price: cgData[coingeckoId].usd,
              priceChange24h: cgData[coingeckoId].usd_24h_change,
              lastUpdatedAt: cgData[coingeckoId].last_updated_at,
            }
          }
        }
      } catch (error) {
        console.error("Error fetching price from CoinGecko:", error)
      }
    }

    return NextResponse.json({
      metadata: jupiterData,
      price: priceData,
    })
  } catch (error) {
    logError(error, "token/jupiter API", { tokenAddress: req.body?.tokenAddress })

    return NextResponse.json(
      {
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
