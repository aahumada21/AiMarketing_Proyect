// Credit system utilities

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { 
  OrgWallet, 
  CreditsLedger, 
  AdjustCreditsForm,
  ApiResponse 
} from './types';

// Client-side credit utilities
export async function adjustOrganizationCredits(form: AdjustCreditsForm): Promise<ApiResponse<boolean>> {
  const supabase = createAdminClient(); // Use admin client for RPC calls
  
  try {
    const { data, error } = await supabase.rpc('adjust_org_credits_rpc', {
      p_organization_id: form.organization_id,
      p_delta: form.delta,
      p_reason: form.reason
    });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data: data, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getOrganizationWallet(organizationId: string): Promise<ApiResponse<OrgWallet>> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  
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

export async function getCreditsLedger(
  organizationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ApiResponse<CreditsLedger[]>> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('credits_ledger')
      .select(`
        *,
        project:projects(name),
        user_profile:profiles(full_name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
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

export async function getProjectCreditsUsed(
  projectId: string,
  month?: string // YYYY-MM format
): Promise<ApiResponse<number>> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('credits_ledger')
      .select('delta')
      .eq('project_id', projectId)
      .eq('source', 'debit');
    
    if (month) {
      const startDate = `${month}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().slice(0, 10);
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else {
      // Current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('created_at', startOfMonth);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    const totalUsed = data?.reduce((sum, entry) => sum + Math.abs(entry.delta), 0) || 0;
    
    return { data: totalUsed, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getOrganizationCreditsUsed(
  organizationId: string,
  month?: string // YYYY-MM format
): Promise<ApiResponse<number>> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('credits_ledger')
      .select('delta')
      .eq('organization_id', organizationId)
      .eq('source', 'debit');
    
    if (month) {
      const startDate = `${month}-01`;
      const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).toISOString().slice(0, 10);
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    } else {
      // Current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      query = query.gte('created_at', startOfMonth);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    const totalUsed = data?.reduce((sum, entry) => sum + Math.abs(entry.delta), 0) || 0;
    
    return { data: totalUsed, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getCreditsPerVideo(): Promise<ApiResponse<number>> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  
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

export async function updateCreditsPerVideo(credits: number): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('global_settings')
      .upsert({
        key: 'credits_per_video',
        value: { credits_per_video: credits },
        updated_at: new Date().toISOString()
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

// Credit analytics
export async function getCreditsAnalytics(
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<{
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  monthlyUsage: Array<{ month: string; used: number }>;
  projectUsage: Array<{ project_id: string; project_name: string; used: number }>;
}>> {
  const supabase = createClient();
  
  try {
    // Get wallet balance
    const { data: wallet } = await supabase
      .from('org_wallets')
      .select('balance')
      .eq('organization_id', organizationId)
      .single();
    
    // Get total credits allocated
    const { data: allocated } = await supabase
      .from('credits_ledger')
      .select('delta')
      .eq('organization_id', organizationId)
      .eq('source', 'allocation');
    
    const totalAllocated = allocated?.reduce((sum, entry) => sum + entry.delta, 0) || 0;
    
    // Get used credits
    let usedQuery = supabase
      .from('credits_ledger')
      .select('delta, created_at, project_id')
      .eq('organization_id', organizationId)
      .eq('source', 'debit');
    
    if (startDate) {
      usedQuery = usedQuery.gte('created_at', startDate);
    }
    if (endDate) {
      usedQuery = usedQuery.lte('created_at', endDate);
    }
    
    const { data: used } = await usedQuery;
    const totalUsed = used?.reduce((sum, entry) => sum + Math.abs(entry.delta), 0) || 0;
    
    // Get monthly usage
    const monthlyUsage: Array<{ month: string; used: number }> = [];
    if (used) {
      const monthlyMap = new Map<string, number>();
      used.forEach(entry => {
        const month = entry.created_at.slice(0, 7); // YYYY-MM
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + Math.abs(entry.delta));
      });
      monthlyUsage.push(...Array.from(monthlyMap.entries()).map(([month, used]) => ({ month, used })));
    }
    
    // Get project usage
    const projectUsage: Array<{ project_id: string; project_name: string; used: number }> = [];
    if (used) {
      const projectMap = new Map<string, number>();
      used.forEach(entry => {
        if (entry.project_id) {
          projectMap.set(entry.project_id, (projectMap.get(entry.project_id) || 0) + Math.abs(entry.delta));
        }
      });
      
      // Get project names
      const projectIds = Array.from(projectMap.keys());
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
        
        projectUsage.push(...Array.from(projectMap.entries()).map(([project_id, used]) => {
          const project = projects?.find(p => p.id === project_id);
          return { project_id, project_name: project?.name || 'Unknown', used };
        }));
      }
    }
    
    const analytics = {
      totalCredits: totalAllocated,
      usedCredits: totalUsed,
      availableCredits: wallet?.balance || 0,
      monthlyUsage,
      projectUsage
    };
    
    return { data: analytics, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

