import { getSupabaseClient, getSupabaseAdmin } from '../supabase/utils';
import { TokenData } from '../types/database';

/**
 * Saves or updates token data in Supabase
 * If the token already exists (by address), it will be updated
 * If it doesn't exist, a new record will be created
 */
export async function saveTokenData(tokenData: TokenData): Promise<{ success: boolean; error?: string; data?: TokenData }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tokens")
      .upsert(tokenData)
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
    console.error("Error saving token data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save token data",
    };
  }
}

/**
 * Gets token data from Supabase by address
 */
export async function getTokenByAddress(address: string): Promise<{ success: boolean; error?: string; data?: TokenData }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("address", address)
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
    console.error("Error getting token by address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get token by address",
    };
  }
}

/**
 * Gets token data from Supabase by symbol
 */
export async function getTokenBySymbol(symbol: string): Promise<{ success: boolean; error?: string; data?: TokenData }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .eq("symbol", symbol)
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
    console.error("Error getting token by symbol:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get token by symbol",
    };
  }
}

/**
 * Gets all tokens from Supabase
 */
export async function getAllTokens(): Promise<{ success: boolean; error?: string; data?: TokenData[] }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("tokens")
      .select("*")
      .order("symbol", { ascending: true });

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
    console.error("Error getting all tokens:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get all tokens",
    };
  }
}

/**
 * Updates token price data
 */
export async function updateTokenPrice(
  address: string,
  priceUsd: number,
  priceChange24h?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();
    
    const updateData: Partial<TokenData> = {
      price_usd: priceUsd,
      updated_at: new Date().toISOString(),
    };

    if (priceChange24h !== undefined) {
      updateData.price_change_24h = priceChange24h;
    }

    const { error } = await supabase
      .from("tokens")
      .update(updateData)
      .eq("address", address);

    if (error) {
      console.error('Error updating token price:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating token price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update token price',
    };
  }
}
