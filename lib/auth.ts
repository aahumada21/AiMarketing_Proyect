// Enhanced auth utilities for IA-Marketing platform

import { createClient } from '@/lib/supabase/client';
import { createAdminClient, createServerAdminClient } from '@/lib/supabase/admin';
import type { 
  UserContext, 
  Organization, 
  OrganizationWithDetails, 
  Profile,
  OrganizationMember 
} from './types';

// Client-side auth utilities
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  
  return user;
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  // Use server admin client to bypass RLS for this operation
  const supabase = createServerAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user profile:', {
      error: error,
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId: userId
    });
    
    // If profile doesn't exist, try to create one
    if (error.code === 'PGRST116') { // No rows returned
      console.log('Profile not found, creating one...');
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const newProfile = await createUserProfile(userId, user.user.email || 'Usuario');
        return newProfile;
      }
    } else {
      // For other errors, try to create profile anyway
      console.log('Profile error, attempting to create profile...');
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const newProfile = await createUserProfile(userId, user.user.email || 'Usuario');
        return newProfile;
      }
    }
    
    return null;
  }
  
  return data;
}

export async function getUserOrganizations(userId: string): Promise<OrganizationWithDetails[]> {
  // Use server admin client to bypass RLS for this operation
  const supabase = createServerAdminClient();
  
  // Get organizations where user is a member
  const { data: memberships, error: membershipsError } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization:organizations(*)
    `)
    .eq('user_id', userId);
  
  if (membershipsError) {
    console.error('Error getting user organizations:', {
      error: membershipsError,
      userId: userId,
      message: membershipsError.message,
      details: membershipsError.details,
      hint: membershipsError.hint
    });
    return [];
  }
  
  // If no memberships found, return empty array (user not in any organizations)
  if (!memberships || memberships.length === 0) {
    return [];
  }
  
  // Get detailed information for each organization
  const organizations: OrganizationWithDetails[] = [];
  
  for (const membership of memberships || []) {
    const org = membership.organization as Organization;
    
    // Get wallet
    const { data: wallet } = await supabase
      .from('org_wallets')
      .select('*')
      .eq('organization_id', org.id)
      .single();
    
    // Get projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_active', true);
    
    // Get all members
    const { data: members } = await supabase
      .from('organization_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('organization_id', org.id);
    
    // Calculate total credits used
    const { data: creditsUsed } = await supabase
      .from('credits_ledger')
      .select('delta')
      .eq('organization_id', org.id)
      .eq('source', 'debit');
    
    const totalCreditsUsed = creditsUsed?.reduce((sum, entry) => sum + Math.abs(entry.delta), 0) || 0;
    
    organizations.push({
      ...org,
      wallet,
      projects: projects || [],
      members: members || [],
      total_credits_used: totalCreditsUsed
    });
  }
  
  return organizations;
}

export async function isSuperadmin(userId: string): Promise<boolean> {
  // Use server admin client to bypass RLS for this operation
  const supabase = createServerAdminClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'superadmin')
    .single();
  
  if (error) {
    return false;
  }
  
  return !!data;
}

export async function getUserContext(): Promise<UserContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const [profile, organizations, isSuperadminFlag] = await Promise.all([
    getUserProfile(user.id),
    getUserOrganizations(user.id),
    isSuperadmin(user.id)
  ]);
  
  return {
    user,
    profile,
    organizations,
    current_organization: organizations[0] || null, // Default to first org
    is_superadmin: isSuperadminFlag
  };
}

// Permission checking utilities
export async function canAccessOrganization(userId: string, organizationId: string): Promise<boolean> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();
  
  return !error && !!data;
}

export async function canManageOrganization(userId: string, organizationId: string): Promise<boolean> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .in('role', ['admin', 'superadmin'])
    .single();
  
  return !error && !!data;
}

export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();
  
  return !error && !!data;
}

export async function canManageProject(userId: string, projectId: string): Promise<boolean> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('role', 'owner')
    .single();
  
  return !error && !!data;
}

// Profile management
export async function createUserProfile(userId: string, fullName: string): Promise<Profile | null> {
  // Use server admin client to bypass RLS for this operation
  const supabase = createServerAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      full_name: fullName
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
  
  return data;
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  // Use regular client for client-side operations
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  
  return data;
}
