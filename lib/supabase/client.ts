import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a Supabase client for client-side usage (with anon key)
export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Create a Supabase admin client for server-side usage (with service role key)
// This should only be used in server-side code (API routes)
let supabaseAdminClient = null;

// Only initialize the admin client if we're on the server side
if (typeof window === 'undefined') {
  // Server-side code
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  } else if (!supabaseServiceRoleKey) {
    console.error('Supabase Service Role Key is missing. Please check your environment variables.');
  }
}

export const supabaseAdmin = supabaseAdminClient;
