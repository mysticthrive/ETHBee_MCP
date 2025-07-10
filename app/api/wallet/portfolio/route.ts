import { NextResponse } from "next/server";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils";
import { getWalletPortfolio } from "@/lib/services/wallet-service";

export async function POST(req: Request) {
  try {
    const { user_wallet, include_performance = false } = await req.json();

    if (!user_wallet) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required field: user_wallet" 
      }, { status: 400 });
    }

    console.log(`API: Fetching wallet portfolio for ${user_wallet}`);

    const portfolio = await getWalletPortfolio(user_wallet, include_performance);

    return NextResponse.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    logError(error, "wallet/portfolio API");

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
