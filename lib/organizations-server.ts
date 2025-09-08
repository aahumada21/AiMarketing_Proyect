// Server-side organization management utilities
// This file should only be used in Server Components and API routes

import { createServerClient } from '@/lib/supabase/server';
import type { 
  Organization, 
  OrganizationWithDetails, 
  ApiResponse 
} from './types';

// Server-side organization utilities
export async function getServerOrganization(organizationId: string): Promise<ApiResponse<OrganizationWithDetails>> {
  const supabase = createServerClient();
  
  try {
    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();
    
    if (orgError) {
      return { data: null, error: orgError.message, success: false };
    }
    
    // Get wallet
    const { data: wallet } = await supabase
      .from('org_wallets')
      .select('*')
      .eq('organization_id', organizationId)
      .single();
    
    // Get projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);
    
    // Get members
    const { data: members } = await supabase
      .from('organization_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('organization_id', organizationId);
    
    // Calculate total credits used
    const { data: creditsUsed } = await supabase
      .from('credits_ledger')
      .select('delta')
      .eq('organization_id', organizationId)
      .eq('source', 'debit');
    
    const totalCreditsUsed = creditsUsed?.reduce((sum, entry) => sum + Math.abs(entry.delta), 0) || 0;
    
    const organizationWithDetails: OrganizationWithDetails = {
      ...organization,
      wallet,
      projects: projects || [],
      members: members || [],
      total_credits_used: totalCreditsUsed
    };
    
    return { data: organizationWithDetails, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getServerOrganizations(): Promise<ApiResponse<Organization[]>> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data: data || [], error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}
