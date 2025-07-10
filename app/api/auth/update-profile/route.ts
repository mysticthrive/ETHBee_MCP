import { NextResponse } from "next/server"
import { updateUserProfile } from "@/lib/services/auth-service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, updates, currentPassword } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No updates provided" }, { status: 400 })
    }

    // Password update requires current password verification
    if (updates.password && !currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is required to update password" },
        { status: 400 },
      )
    }

    const result = await updateUserProfile(userId, updates, currentPassword)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error("Update profile API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
