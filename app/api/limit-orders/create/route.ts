import { NextResponse } from "next/server";
import { createLimitOrder } from "@/lib/services/limit-order-service";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils";

export async function POST(req: Request) {
  try {
    const orderData = await req.json();

    if (!orderData.user_wallet || !orderData.token_address || !orderData.token_symbol || 
        !orderData.action_type || !orderData.amount || !orderData.limit_price) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields for limit order" 
      }, { status: 400 });
    }

    console.log(`API: Creating limit order for ${orderData.action_type} ${orderData.amount} ${orderData.token_symbol} at ${orderData.limit_price}`);

    // Set initial status to pending
    orderData.status = 'pending';
    
    // Create the limit order
    const result = await createLimitOrder(orderData);

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Your ${orderData.action_type} limit order for ${orderData.amount} ${orderData.token_symbol} at $${orderData.limit_price} has been created successfully.`,
      data: result.data
    });
  } catch (error) {
    logError(error, "limit-orders/create API");

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
