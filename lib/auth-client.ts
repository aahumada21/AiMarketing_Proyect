// Client-side auth utilities that use API routes

import { createClient } from '@/lib/supabase/client';
import { apiCallJson } from '@/lib/api-client';
import type { UserContext } from './types';

/**
 * Get user context using API route (server-side operations)
 */
export async function getUserContextViaAPI(): Promise<UserContext | null> {
  try {
    const result = await apiCallJson<UserContext>('/api/auth/user-context', {
      method: 'GET'
    });
    
    if (result.success) {
      return result.data || null;
    } else {
      console.error('API returned error:', result.error);
      return null;
    }

  } catch (error) {
    console.error('Error getting user context via API:', error);
    return null;
  }
}

/**
 * Get current user (client-side only)
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  
  return user;
}
