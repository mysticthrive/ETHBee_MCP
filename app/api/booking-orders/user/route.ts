import { NextResponse } from "next/server"
import { getUserBookingOrders } from "@/lib/services/booking-order-service"
import { logError, getUserFriendlyErrorMessage } from "@/lib/utils/error-utils"

export async function POST(req: Request) {
  try {
    const { user_id, status } = await req.json()

    if (!user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      )
    }

    console.log(`API: Getting booking orders for user ${user_id}${status ? ` with status ${status}` : ""}`)

    // Get user's booking orders
    const result = await getUserBookingOrders(user_id, status)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      count: Array.isArray(result.data) ? result.data.length : 0,
    })
  } catch (error) {
    logError(error, "booking-orders/user API")

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
