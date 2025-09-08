// Utility functions for making API calls with automatic session refresh

import { createClient } from '@/lib/supabase/client';

/**
 * Make an API call with automatic session refresh if needed
 */
export async function apiCall(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();
  
  // Get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError);
    // Try to refresh the session
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshedSession) {
      console.error('Failed to refresh session:', refreshError);
      throw new Error('Session expired and could not be refreshed');
    }
    // Use refreshed session
    return fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${refreshedSession.access_token}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  if (!session) {
    throw new Error('No session found');
  }
  
  // Make the API call with current session
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Make an API call and return parsed JSON response
 */
export async function apiCallJson<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await apiCall(endpoint, options);
    
    if (!response.ok) {
      console.error('API call failed:', response.status, response.statusText);
      return { success: false, error: `API call failed: ${response.status}` };
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Error in API call:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
