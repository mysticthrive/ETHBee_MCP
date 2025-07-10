import { supabaseClient } from '@/lib/supabase/client';
import { LimitOrder } from "@/lib/types/limit-order-types";
import { logError } from '@/lib/utils/error-utils';

// Define the response type for limit order operations
export interface LimitOrderResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Creates a new limit order
 */
export async function createLimitOrder(order: Omit<LimitOrder, 'id' | 'created_at' | 'updated_at'>): Promise<LimitOrderResponse> {
  try {
    console.log('Creating limit order:', order);

    if (!supabaseClient) {
      console.error('Supabase client is not initialized. Check your environment variables.');
      return {
        success: false,
        error: 'Supabase client is not initialized. Check your environment variables.'
      };
    }

    const { data, error } = await supabaseClient
      .from('limit_orders')
      .insert(order)
      .select()
      .single();

    if (error) {
      logError(error, 'createLimitOrder', { order });
      return {
        success: false,
        error: `Failed to create limit order: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    logError(error, 'createLimitOrder', { order });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating limit order'
    };
  }
}

/**
 * Gets all limit orders for a user
 */
export async function getUserLimitOrders(userWallet: string): Promise<LimitOrderResponse> {
  try {
    console.log('Getting limit orders for user:', userWallet);

    if (!supabaseClient) {
      console.error('Supabase client is not initialized. Check your environment variables.');
      return {
        success: false,
        error: 'Supabase client is not initialized. Check your environment variables.'
      };
    }

    const { data, error } = await supabaseClient
      .from('limit_orders')
      .select('*')
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false });

    if (error) {
      logError(error, 'getUserLimitOrders', { userWallet });
      return {
        success: false,
        error: `Failed to get limit orders: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    logError(error, 'getUserLimitOrders', { userWallet });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting limit orders'
    };
  }
}

/**
 * Cancels a limit order
 */
export async function cancelLimitOrder(orderId: string, userWallet: string): Promise<LimitOrderResponse> {
  try {
    console.log('Cancelling limit order:', orderId, 'for user:', userWallet);

    if (!supabaseClient) {
      console.error('Supabase client is not initialized. Check your environment variables.');
      return {
        success: false,
        error: 'Supabase client is not initialized. Check your environment variables.'
      };
    }

    const { data, error } = await supabaseClient
      .from('limit_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_wallet', userWallet)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      logError(error, 'cancelLimitOrder', { orderId, userWallet });
      return {
        success: false,
        error: `Failed to cancel limit order: ${error.message}`
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    logError(error, 'cancelLimitOrder', { orderId, userWallet });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error cancelling limit order'
    };
  }
}
