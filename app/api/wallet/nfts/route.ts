import { NextResponse } from "next/server";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils";
import { getWalletNFTs } from "@/lib/services/wallet-service";

export async function POST(req: Request) {
  try {
    const { user_wallet, collection } = await req.json();

    if (!user_wallet) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required field: user_wallet" 
      }, { status: 400 });
    }

    console.log(`API: Fetching wallet NFTs for ${user_wallet}`);

    const nfts = await getWalletNFTs(user_wallet, collection);

    return NextResponse.json({
      success: true,
      data: nfts,
      count: nfts.length
    });
  } catch (error) {
    logError(error, "wallet/nfts API");

    return NextResponse.json(
      {
        success: false,
        error: getUserFriendlyErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
