import { createClient } from "@supabase/supabase-js";

/**
 * Admin client that uses service_role key to bypass RLS
 * Use this ONLY in server-side code for administrative operations
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  
  // Check if we're on the server side
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // Server-side: use service_role key
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } else {
    // Client-side: use anon key (fallback)
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;
    
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }

    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY is not set');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
  }
}

// Alternative function that always uses service_role key (for server-side only)
export function createServerAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
