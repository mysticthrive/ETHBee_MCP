import { NextResponse } from "next/server";
import { cancelLimitOrder } from "@/lib/services/limit-order-service";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils";

export async function POST(req: Request) {
  try {
    const { order_id, user_wallet } = await req.json();

    if (!order_id || !user_wallet) {
      return NextResponse.json({ 
        success: false, 
        error: "Order ID and user wallet are required" 
      }, { status: 400 });
    }

    console.log(`API: Cancelling limit order: ${order_id} for user: ${user_wallet}`);

    // Cancel the limit order
    const result = await cancelLimitOrder(order_id, user_wallet);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logError(error, "limit-orders/cancel API");

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
