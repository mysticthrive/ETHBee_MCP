import { NextResponse } from "next/server"
import { cancelBookingOrder } from "@/lib/services/booking-order-service"
import { logError, getUserFriendlyErrorMessage } from "@/lib/utils/error-utils"

export async function POST(req: Request) {
  try {
    const { order_id, user_id } = await req.json()

    if (!order_id || !user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID and user ID are required",
        },
        { status: 400 },
      )
    }

    console.log(`API: Cancelling booking order ${order_id} for user ${user_id}`)

    // Cancel the booking order
    const result = await cancelBookingOrder(order_id, user_id)

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
      message: result.message,
      data: result.data,
    })
  } catch (error) {
    logError(error, "booking-orders/cancel API")

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
