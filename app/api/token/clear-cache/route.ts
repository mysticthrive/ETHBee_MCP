import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // This endpoint is no longer needed since caching is disabled
    return NextResponse.json({ success: true, message: "Cache functionality is disabled" })
  } catch (error) {
    console.error("Error handling cache clear request:", error)
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 })
  }
}
