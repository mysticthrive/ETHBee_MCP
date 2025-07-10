import { NextResponse } from "next/server"
import { getTokenHolders } from "@/lib/services/token-service"
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils"

export async function POST(req: Request) {
  try {
    const { tokenAddress, limit = 100, bypassCache = false } = await req.json()

    if (!tokenAddress) {
      return NextResponse.json({ error: "Token address is required" }, { status: 400 })
    }

    console.log(`API: Getting token holders for: ${tokenAddress} (limit: ${limit}, bypassCache: ${bypassCache})`)

    // Get token holders with total count
    const { holders, totalUniqueHolders } = await getTokenHolders(tokenAddress, bypassCache, limit)

    return NextResponse.json({
      holders,
      count: holders.length,
      totalUniqueHolders,
    })
  } catch (error) {
    logError(error, "token/holders API", { tokenAddress: req.body?.tokenAddress })

    return NextResponse.json(
      {
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
