import { supabaseAdmin, supabaseClient } from './client';

/**
 * Gets the Supabase admin client, ensuring it's only used in server-side code.
 * @throws Error if the admin client is not initialized (e.g., when used on client side)
 */
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not initialized. This should only be called from server-side code.');
  }
  return supabaseAdmin;
}

/**
 * Gets the Supabase client for client-side operations.
 * @throws Error if the client is not initialized
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error('Supabase client is not initialized. Please check your environment variables.');
  }
  return supabaseClient;
} 