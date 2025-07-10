import { NextResponse } from "next/server"
import { RPC_CONFIG } from "@/lib/config/rpc-config"

export async function GET() {
  try {
    if (!RPC_CONFIG.premium.helius) {
      return NextResponse.json(
        {
          success: false,
          error: "Helius API URL is not configured",
        },
        { status: 400 },
      )
    }

    const heliusUrl = RPC_CONFIG.premium.helius

    // Test the Helius connection with a simple request
    const response = await fetch(heliusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-test",
        method: "getHealth",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error: `Helius API returned an error: ${errorText}`,
        },
        { status: 500 },
      )
    }

    const data = await response.json()

    // Also test the getAsset method with a known token (SOL)
    const solAddress = "So11111111111111111111111111111111111111112"
    const assetResponse = await fetch(heliusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "helius-asset-test",
        method: "getAsset",
        params: {
          id: solAddress,
        },
      }),
    })

    let assetData = null
    let assetSuccess = false

    if (assetResponse.ok) {
      assetData = await assetResponse.json()
      assetSuccess = !!assetData.result
    }

    return NextResponse.json({
      success: true,
      heliusUrl: heliusUrl.split("?")[0], // Remove API key from the response
      response: data,
      assetTest: {
        success: assetSuccess,
        data: assetSuccess ? "Asset data retrieved successfully" : "Failed to retrieve asset data",
      },
    })
  } catch (error) {
    console.error("Error testing Helius connection:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error testing Helius connection",
      },
      { status: 500 },
    )
  }
}
