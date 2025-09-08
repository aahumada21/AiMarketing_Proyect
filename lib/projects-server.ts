// Server-side project management utilities
// This file should only be used in Server Components and API routes

import { createServerClient } from '@/lib/supabase/server';
import type { 
  Project, 
  ProjectWithDetails, 
  ApiResponse 
} from './types';

// Server-side project utilities
export async function getServerProject(projectId: string): Promise<ApiResponse<ProjectWithDetails>> {
  const supabase = createServerClient();
  
  try {
    // Get project with organization
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      return { data: null, error: projectError.message, success: false };
    }
    
    // Get members
    const { data: members } = await supabase
      .from('project_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('project_id', projectId);
    
    // Get credit limit
    const { data: creditLimit } = await supabase
      .from('project_credit_limits')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    // Get video count
    const { count: videoCount } = await supabase
      .from('video_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    
    // Get used credits this month
    const { data: creditsUsed } = await supabase
      .from('credits_ledger')
      .select('delta')
      .eq('project_id', projectId)
      .eq('source', 'debit')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
    
    const usedCreditsThisMonth = creditsUsed?.reduce((sum, entry) => sum + Math.abs(entry.delta), 0) || 0;
    
    const projectWithDetails: ProjectWithDetails = {
      ...project,
      organization: project.organization,
      members: members || [],
      credit_limit: creditLimit,
      video_count: videoCount || 0,
      used_credits_this_month: usedCreditsThisMonth
    };
    
    return { data: projectWithDetails, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getServerOrganizationProjects(organizationId: string): Promise<ApiResponse<Project[]>> {
  const supabase = createServerClient();
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
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
