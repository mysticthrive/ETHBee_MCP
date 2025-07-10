import { Keypair, PublicKey, Transaction, VersionedTransaction, Commitment } from "@solana/web3.js";
import { createSolanaRpc, type Base64EncodedWireTransaction } from "@solana/kit";
import { simulateTransaction, sendTransaction } from "@/lib/services/solana-service";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils";
import { convertToSmallestUnit } from "@/lib/utils/token-utils";

// Common token addresses
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  BALL: 'BALLrveijbhu42QaS2XW1pRBYfMji73bGeYJghUvQs6y',
};

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: string;
  swapMode?: "ExactIn" | "ExactOut";
  platformFeeBps?: string;
}

interface SwapParams {
  userPublicKey: string;
  quoteResponse: any;
  prioritizationFeeLamports?: {
    priorityLevelWithMaxLamports: {
      maxLamports: number;
      priorityLevel: "low" | "medium" | "high" | "veryHigh";
    };
  };
  dynamicComputeUnitLimit?: boolean;
  feeAccount?: string;
}

export class TradingService {
  private readonly jupiterQuoteUrl = "https://lite-api.jup.ag/swap/v1/quote";
  private readonly jupiterSwapUrl = "https://lite-api.jup.ag/swap/v1/swap";

  /**
   * Get a quote for swapping tokens
   */
  async getQuote(params: QuoteParams) {
    try {
      // Convert amount to smallest unit for Jupiter API
      const smallestUnitAmount = await convertToSmallestUnit(params.amount, params.outputMint);
      
      // Construct query parameters
      const queryParams = new URLSearchParams({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: smallestUnitAmount,
        swapMode: params.swapMode || "ExactIn",
      });

      // Add optional parameters if they exist
      if (params.slippageBps) queryParams.append("slippageBps", params.slippageBps);
      if (params.platformFeeBps) queryParams.append("platformFeeBps", params.platformFeeBps);

      console.log("Jupiter quote request:", {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        originalAmount: params.amount,
        smallestUnitAmount,
        swapMode: params.swapMode || "ExactIn"
      });

      const response = await fetch(`${this.jupiterQuoteUrl}?${queryParams}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Jupiter API returned an error: ${errorText}`,
          timestamp: new Date().toISOString()
        };
      }

      const quoteData = await response.json();
      return {
        success: true,
        data: {
          ...quoteData,
          timestamp: new Date().toISOString(),
          requestParams: params
        }
      };
    } catch (error) {
      logError(error, "trading/get-quote");
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get a swap transaction
   */
  async getSwapTransaction(params: SwapParams) {
    try {
      const requestBody = {
        userPublicKey: params.userPublicKey,
        quoteResponse: params.quoteResponse,
        prioritizationFeeLamports: params.prioritizationFeeLamports,
        dynamicComputeUnitLimit: params.dynamicComputeUnitLimit,
        feeAccount: params.feeAccount || "FdnM7ijhXH9Gf3KjYmw9UoG9Qh4LsRSsNBu5S33no8EU",
      };

      const response = await fetch(this.jupiterSwapUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Jupiter API returned an error: ${errorText}`,
          timestamp: new Date().toISOString()
        };
      }

      const swapData = await response.json();
      return {
        success: true,
        data: {
          ...swapData,
          timestamp: new Date().toISOString(),
          requestParams: {
            userPublicKey: params.userPublicKey,
            hasPrioritizationFee: !!params.prioritizationFeeLamports,
            dynamicComputeUnitLimit: params.dynamicComputeUnitLimit,
          }
        }
      };
    } catch (error) {
      logError(error, "trading/get-swap");
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute a complete swap
   */
  async executeSwap(params: QuoteParams & { wallet: Keypair }) {
    try {
      // 1. Get quote
      const quoteResult = await this.getQuote(params);
      if (!quoteResult.success) {
        return {
          success: false,
          error: `Failed to get quote: ${quoteResult.error}`,
          timestamp: new Date().toISOString()
        };
      }

      // 2. Get swap transaction
      const swapResult = await this.getSwapTransaction({
        userPublicKey: params.wallet.publicKey.toString(),
        quoteResponse: quoteResult.data
      });
      if (!swapResult.success) {
        return {
          success: false,
          error: `Failed to get swap transaction: ${swapResult.error}`,
          timestamp: new Date().toISOString()
        };
      }

      // 3. Simulate transaction
      const simulateResult = await simulateTransaction(swapResult.data.swapTransaction);
      if (!simulateResult.success) {
        return {
          success: false,
          error: `Transaction simulation failed: ${simulateResult.error}`,
          timestamp: new Date().toISOString()
        };
      }

      // 4. Send transaction
      // const sendResult = await sendTransaction(swapResult.data.swapTransaction, params.wallet);
      // if (!sendResult.success) {
      //   return {
      //     success: false,
      //     error: `Failed to send transaction: ${sendResult.error}`,
      //     timestamp: new Date().toISOString()
      //   };
      // }

      return {
        success: true,
        data: {
          ...simulateResult.data,
          // ...sendResult.data,
          quote: quoteResult.data,
          swap: swapResult.data,
          simulation: simulateResult.data
        }
      };
    } catch (error) {
      logError(error, "trading/execute-swap");
      return {
        success: false,
        error: getUserFriendlyErrorMessage(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  // Helper function to serialize BigInt values
  private serializeBigInt(obj: any): any {
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(this.serializeBigInt);
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, this.serializeBigInt(value)])
      );
    }
    return obj;
  }
}
