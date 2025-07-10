import { createSolanaRpc, type Base64EncodedWireTransaction } from "@solana/kit";
import { Transaction, VersionedTransaction, Keypair, PublicKey, Commitment } from "@solana/web3.js";
import { getUserFriendlyErrorMessage, logError } from "@/lib/utils/error-utils";
import { getWalletBalance } from "./wallet-service";

// interface SimulateConfig {
//   commitment?: "processed" | "confirmed" | "finalized";
//   innerInstructions?: boolean;
//   minContextSlot?: bigint;
// }

interface SimulateConfig {
  sigVerify?: boolean;
  replaceRecentBlockhash?: boolean;
  commitment?: Commitment;
  accounts?: boolean;
  innerInstructions?: boolean;
  minContextSlot?: bigint;
}

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Signs a transaction using the provided wallet
 * @param {string} transaction Base64 encoded transaction
 * @param {Keypair} wallet The wallet Keypair
 * @returns {Promise<ServiceResponse>} Signed transaction in base64 format
 */
async function signTransaction(transaction: string, wallet: Keypair): Promise<ServiceResponse> {
  try {
    // Convert base64 transaction to Uint8Array
    const decoded = Buffer.from(transaction, 'base64');
    const transactionBuffer = new Uint8Array(decoded);
    
    // Try to deserialize as versioned transaction first
    try {
      const versionedTx = VersionedTransaction.deserialize(transactionBuffer);
      versionedTx.sign([wallet]);
      const serialized = versionedTx.serialize();
      return {
        success: true,
        data: Buffer.from(Uint8Array.from(serialized)).toString('base64'),
        timestamp: new Date().toISOString()
      };
    } catch {
      // If versioned deserialization fails, try legacy transaction
      const legacyTx = Transaction.from(transactionBuffer);
      legacyTx.sign(wallet);
      const serialized = legacyTx.serialize();
      return {
        success: true,
        data: Buffer.from(Uint8Array.from(serialized)).toString('base64'),
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    logError(error, "solana/sign");
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Sends a signed transaction to the Solana network
 * @param {string} signedTransaction Base64 encoded signed transaction
 * @param {string} [rpcUrl] Optional RPC URL (defaults to mainnet)
 * @returns {Promise<ServiceResponse>} Transaction signature
 */
async function sendSignedTransaction(signedTransaction: string, rpcUrl?: string): Promise<ServiceResponse> {
  try {
    const rpc = createSolanaRpc(rpcUrl || "https://api.mainnet-beta.solana.com");

    // Decode the transaction to get the fee payer
    const decoded = Buffer.from(signedTransaction, 'base64');
    const transactionBuffer = new Uint8Array(decoded);
    let feePayer: PublicKey | undefined;
    
    try {
      // Try versioned transaction first
      const versionedTx = VersionedTransaction.deserialize(transactionBuffer);
      feePayer = versionedTx.message.staticAccountKeys[0];
    } catch {
      // Fall back to legacy transaction
      const legacyTx = Transaction.from(transactionBuffer);
      feePayer = legacyTx.feePayer;
    }

    if (!feePayer) {
      return {
        success: false,
        error: "Could not determine fee payer from transaction",
        timestamp: new Date().toISOString()
      };
    }

    // Check account balance
    const balance = await getWalletBalance(feePayer.toString());
    console.log("Account balance:", balance, "SOL");

    // Minimum balance check (0.001 SOL)
    const MINIMUM_BALANCE = 0.001;
    if (balance.solBalance < MINIMUM_BALANCE) {
      return {
        success: false,
        error: `Insufficient balance. Account needs at least 0.001 SOL (${MINIMUM_BALANCE} SOL) to send transactions. Current balance: ${balance.solBalance} SOL`,
        timestamp: new Date().toISOString()
      };
    }

    // Send the transaction
    const signature = await rpc
      .sendTransaction(signedTransaction as Base64EncodedWireTransaction, {
        encoding: "base64",
      })
      .send();

    return {
      success: true,
      data: signature,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError(error, "solana/send");
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Simulates a transaction before sending it
 * @param {string} transaction Base64 encoded transaction
 * @returns {Promise<ServiceResponse>} Simulation results
 */
async function simulateTransaction(transaction: string): Promise<ServiceResponse> {
  try {
    const rpc = createSolanaRpc(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
    const simulation = await rpc.simulateTransaction(
      transaction as Base64EncodedWireTransaction,
      {
        sigVerify: false as const,
        replaceRecentBlockhash: false as const,
        commitment: "confirmed",
        encoding: "base64",
        innerInstructions: true
      }
    );

    return {
      success: true,
      data: simulation,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError(error, "solana/simulate");
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Checks if a wallet has sufficient balance for a transaction
 * @param {string} walletAddress The wallet address to check
 * @param {number} requiredAmount The amount required in SOL
 * @returns {Promise<ServiceResponse>} Whether the wallet has sufficient balance
 */
async function hasSufficientBalance(walletAddress: string, requiredAmount: number): Promise<ServiceResponse> {
  try {
    const balance = await getWalletBalance(walletAddress);
    const hasBalance = typeof balance.solBalance === 'number' && balance.solBalance >= requiredAmount;
    return {
      success: true,
      data: hasBalance,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError(error, "solana/balance");
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Signs and sends a transaction
 * @param {string} transaction Base64 encoded transaction
 * @param {Keypair} wallet The wallet to sign with
 * @param {string} [rpcUrl] Optional RPC URL (defaults to mainnet)
 * @returns {Promise<ServiceResponse>} Transaction result with signature
 */
async function sendTransaction(transaction: string, wallet: Keypair, rpcUrl?: string): Promise<ServiceResponse> {
  try {
    // Sign the transaction
    const signResult = await signTransaction(transaction, wallet);
    if (!signResult.success) {
      return {
        success: false,
        error: `Failed to sign transaction: ${signResult.error}`,
        timestamp: new Date().toISOString()
      };
    }

    // Send the signed transaction
    const sendResult = await sendSignedTransaction(signResult.data, rpcUrl);
    if (!sendResult.success) {
      return {
        success: false,
        error: `${sendResult.error}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      data: {
        signature: sendResult.data,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logError(error, "solana/send");
    return {
      success: false,
      error: getUserFriendlyErrorMessage(error),
      timestamp: new Date().toISOString()
    };
  }
}

// Helper function to serialize BigInt values
function serializeBigInt(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
}

export {
  signTransaction,
  sendSignedTransaction,
  simulateTransaction,
  sendTransaction,
  hasSufficientBalance
};
