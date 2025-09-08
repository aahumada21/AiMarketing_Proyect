// Project management utilities

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { 
  Project, 
  ProjectWithDetails, 
  CreateProjectForm,
  ProjectMember,
  ApiResponse 
} from './types';

// Client-side project utilities
export async function createProject(form: CreateProjectForm): Promise<ApiResponse<Project>> {
  const supabase = createAdminClient(); // Use admin client for RPC calls
  
  try {
    const { data, error } = await supabase.rpc('create_project_rpc', {
      p_organization_id: form.organization_id,
      p_name: form.name
    });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    // Fetch the created project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', data)
      .single();
    
    if (fetchError) {
      return { data: null, error: fetchError.message, success: false };
    }
    
    return { data: project, error: null, success: true };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      success: false 
    };
  }
}

export async function getProject(projectId: string): Promise<ApiResponse<ProjectWithDetails>> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  
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

export async function getOrganizationProjects(organizationId: string): Promise<ApiResponse<Project[]>> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  
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

export async function updateProject(
  projectId: string, 
  updates: Partial<Project>
): Promise<ApiResponse<Project>> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
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

export async function deleteProject(projectId: string): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('projects')
      .update({ is_active: false })
      .eq('id', projectId);
    
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

// Project member management
export async function addProjectMember(
  projectId: string, 
  userId: string, 
  role: 'owner' | 'member' = 'member'
): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
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

export async function removeProjectMember(
  projectId: string, 
  userId: string
): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
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

export async function updateProjectMemberRole(
  projectId: string, 
  userId: string, 
  role: 'owner' | 'member'
): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
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

export async function getProjectMembers(projectId: string): Promise<ApiResponse<ProjectMember[]>> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('project_id', projectId);
    
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

// Project credit limits
export async function updateProjectCreditLimit(
  projectId: string,
  monthlyCap: number
): Promise<ApiResponse<boolean>> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('project_credit_limits')
      .upsert({
        project_id: projectId,
        monthly_cap: monthlyCap,
        month_key: new Date().toISOString().slice(0, 7) + '-01', // First day of current month
        used_this_month: 0,
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

