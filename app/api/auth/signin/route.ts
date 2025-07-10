import { NextResponse } from "next/server"
import { signIn } from "@/lib/services/auth-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const result = await signIn({ email, password })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      wallet: result.wallet,
    })
  } catch (error) {
    console.error("Signin API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
