// Organization management utilities

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { 
  Organization, 
  OrganizationWithDetails, 
  CreateOrganizationForm,
  ApiResponse 
} from './types';

// Client-side organization utilities
export async function createOrganization(form: CreateOrganizationForm): Promise<ApiResponse<Organization>> {
  const supabase = createAdminClient(); // Use admin client for RPC calls
  
  try {
    const { data, error } = await supabase.rpc('create_organization_rpc', {
      p_name: form.name
    });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    // Fetch the created organization
    const { data: organization, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', data)
      .single();
    
    if (fetchError) {
      return { data: null, error: fetchError.message, success: false };
    }
    
    return { data: organization, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getOrganization(organizationId: string): Promise<ApiResponse<OrganizationWithDetails>> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  
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

export async function updateOrganization(
  organizationId: string, 
  updates: Partial<Organization>
): Promise<ApiResponse<Organization>> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select()
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

export async function deleteOrganization(organizationId: string): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data: true, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function addOrganizationMember(
  organizationId: string, 
  userId: string, 
  role: 'admin' | 'member' = 'member'
): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role
      });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data: true, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function removeOrganizationMember(
  organizationId: string, 
  userId: string
): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data: true, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function updateOrganizationMemberRole(
  organizationId: string, 
  userId: string, 
  role: 'admin' | 'member'
): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data: true, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

