// Server-side auth utilities for IA-Marketing platform
// This file should only be used in Server Components and API routes

import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { 
  UserContext, 
  Organization, 
  OrganizationWithDetails, 
  Profile,
  OrganizationMember 
} from './types';

// Server-side auth utilities
export async function getServerUser() {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting server user:', error);
    return null;
  }
  
  return user;
}

export async function getServerUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error getting server user profile:', error);
    return null;
  }
  
  return data;
}

export async function getServerUserOrganizations(userId: string): Promise<OrganizationWithDetails[]> {
  const supabase = createServerClient();
  
  // Get organizations where user is a member
  const { data: memberships, error: membershipsError } = await supabase
    .from('organization_members')
    .select(`
      role,
      organization:organizations(*)
    `)
    .eq('user_id', userId);
  
  if (membershipsError) {
    console.error('Error getting server user organizations:', membershipsError);
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

export async function isServerSuperadmin(userId: string): Promise<boolean> {
  const supabase = createServerClient();
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

export async function getServerUserContext(): Promise<UserContext | null> {
  const user = await getServerUser();
  if (!user) return null;
  
  const [profile, organizations, isSuperadminFlag] = await Promise.all([
    getServerUserProfile(user.id),
    getServerUserOrganizations(user.id),
    isServerSuperadmin(user.id)
  ]);
  
  return {
    user,
    profile,
    organizations,
    current_organization: organizations[0] || null, // Default to first org
    is_superadmin: isSuperadminFlag
  };
}

// Permission checking utilities for server-side
export async function canAccessOrganizationServer(userId: string, organizationId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();
  
  return !error && !!data;
}

export async function canManageOrganizationServer(userId: string, organizationId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .in('role', ['admin', 'superadmin'])
    .single();
  
  return !error && !!data;
}

export async function canAccessProjectServer(userId: string, projectId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();
  
  return !error && !!data;
}

export async function canManageProjectServer(userId: string, projectId: string): Promise<boolean> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('role', 'owner')
    .single();
  
  return !error && !!data;
}
