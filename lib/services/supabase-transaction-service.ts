import { getSupabaseClient, getSupabaseAdmin } from '../supabase/utils';
import { TransactionData } from '../types/database';

/**
 * Saves transaction data to Supabase
 */
export async function saveTransactionData(
  transactionData: TransactionData,
  userId: string
): Promise<{ success: boolean; error?: string; data?: TransactionData }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ...transactionData,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error saving transaction data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save transaction data",
    };
  }
}

/**
 * Updates transaction status
 */
export async function updateTransactionStatus(
  id: string,
  status: 'pending' | 'success' | 'failed',
  txHash?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    
    const updateData: Partial<TransactionData> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (txHash) {
      updateData.tx_hash = txHash;
    }

    const { error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error('Error updating transaction status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update transaction status',
    };
  }
}

/**
 * Gets transaction by ID
 */
export async function getTransactionById(
  id: string
): Promise<{ success: boolean; error?: string; data?: TransactionData }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error('Error fetching transaction by ID:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error getting transaction by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting transaction data',
    };
  }
}

/**
 * Gets transactions by user wallet address
 */
export async function getTransactionsByWallet(
  walletAddress: string
): Promise<{ success: boolean; error?: string; data?: TransactionData[] }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_wallet", walletAddress)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Error fetching transactions by wallet:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error getting transactions by wallet:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transactions by wallet",
    };
  }
}

/**
 * Gets transactions by token address
 */
export async function getTransactionsByToken(
  tokenAddress: string
): Promise<{ success: boolean; error?: string; data?: TransactionData[] }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("token_address", tokenAddress)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Error fetching transactions by token:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error getting transactions by token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transactions by token",
    };
  }
}

/**
 * Gets recent transactions (limited to a specific count)
 */
export async function getRecentTransactions(
  limit: number = 10
): Promise<{ success: boolean; error?: string; data?: TransactionData[] }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent transactions:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error getting recent transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting transaction data',
    };
  }
}

export async function getTransactionByHash(
  txHash: string
): Promise<{ success: boolean; error?: string; data?: TransactionData }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("tx_hash", txHash)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error getting transaction by hash:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transaction by hash",
    };
  }
}

/**
 * Gets transactions by user ID
 */
export async function getTransactionsByUserId(
  userId: string
): Promise<{ success: boolean; error?: string; data?: TransactionData[] }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error('Error fetching transactions by user ID:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error getting transactions by user ID:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get transactions by user ID",
    };
  }
}
