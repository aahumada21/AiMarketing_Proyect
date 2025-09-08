// Server-side credit system utilities
// This file should only be used in Server Components and API routes

import { createServerClient } from '@/lib/supabase/server';
import type { 
  OrgWallet, 
  ApiResponse 
} from './types';

// Server-side credit utilities
export async function getServerOrganizationWallet(organizationId: string): Promise<ApiResponse<OrgWallet>> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('org_wallets')
      .select('*')
      .eq('organization_id', organizationId)
      .single();
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getServerCreditsPerVideo(): Promise<ApiResponse<number>> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'credits_per_video')
      .single();
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    const creditsPerVideo = parseInt(data.value.credits_per_video || '10');
    
    return { data: creditsPerVideo, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}
