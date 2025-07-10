import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // This endpoint is no longer needed since caching is disabled
    return NextResponse.json({
      success: true,
      cachingDisabled: true,
      message: "Token caching is permanently disabled",
    })
  } catch (error) {
    console.error("Error handling cache toggle request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Always return that caching is disabled
    return NextResponse.json({
      success: true,
      cachingDisabled: true,
    })
  } catch (error) {
    console.error("Error getting token cache status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get token cache status",
      },
      { status: 500 },
    )
  }
}
