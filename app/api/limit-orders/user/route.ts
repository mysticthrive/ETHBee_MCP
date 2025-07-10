import { NextResponse } from "next/server";
import { getUserLimitOrders } from "@/lib/services/limit-order-service";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils";

export async function POST(req: Request) {
  try {
    const { user_wallet } = await req.json();

    if (!user_wallet) {
      return NextResponse.json({ 
        success: false, 
        error: "User wallet address is required" 
      }, { status: 400 });
    }

    console.log(`API: Getting limit orders for user: ${user_wallet}`);

    // Get user's limit orders
    const result = await getUserLimitOrders(user_wallet);

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
    logError(error, "limit-orders/user API");

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
