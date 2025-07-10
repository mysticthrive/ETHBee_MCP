import { NextResponse } from "next/server"
import { getUserProfile } from "@/lib/services/auth-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const result = await getUserProfile(userId)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      wallet: result.wallet,
    })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
