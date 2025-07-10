import { NextResponse } from "next/server"
import { createBookingOrder } from "@/lib/services/booking-order-service"
import type { CreateBookingOrderRequest } from "@/lib/types/booking-order-types"
import { logError, getUserFriendlyErrorMessage } from "@/lib/utils/error-utils"

export async function POST(req: Request) {
  try {
    const orderData: CreateBookingOrderRequest = await req.json()

    // Validate required fields
    if (
      !orderData.user_id ||
      !orderData.token_address ||
      !orderData.token_symbol ||
      !orderData.action_type ||
      !orderData.conditions ||
      orderData.conditions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields for booking order",
        },
        { status: 400 },
      )
    }

    console.log(
      `API: Creating booking order for user ${orderData.user_id} - ${orderData.action_type} ${orderData.amount || "N/A"} ${orderData.token_symbol} with ${orderData.conditions.length} condition(s)`,
    )

    // Create the booking order
    const result = await createBookingOrder(orderData)

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
    logError(error, "booking-orders/create API")

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
