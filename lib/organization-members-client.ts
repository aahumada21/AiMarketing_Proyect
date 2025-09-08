// Client-side organization members utilities that use API routes

import { apiCallJson } from '@/lib/api-client';
import type { ApiResponse } from './types';

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'superadmin';
  created_at: string;
  profiles: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface AddMemberForm {
  organization_id: string;
  user_id: string;
  role: 'admin' | 'member';
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: string): Promise<ApiResponse<OrganizationMember[]>> {
  try {
    const result = await apiCallJson<OrganizationMember[]>(`/api/superadmin/organizations/members?organizationId=${organizationId}`, {
      method: 'GET'
    });
    
    if (result.success) {
      return { success: true, data: result.data || [] };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to get organization members' };
    }

  } catch (error) {
    console.error('Error getting organization members:', error);
    return { success: false, error: 'Failed to get organization members' };
  }
}

/**
 * Add member to organization
 */
export async function addOrganizationMember(form: AddMemberForm): Promise<ApiResponse<OrganizationMember>> {
  try {
    const result = await apiCallJson<OrganizationMember>('/api/superadmin/organizations/members', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to add member' };
    }

  } catch (error) {
    console.error('Error adding member:', error);
    return { success: false, error: 'Failed to add member' };
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(organizationId: string, userId: string, role: 'admin' | 'member'): Promise<ApiResponse<OrganizationMember>> {
  try {
    const result = await apiCallJson<OrganizationMember>('/api/superadmin/organizations/members', {
      method: 'PUT',
      body: JSON.stringify({
        organization_id: organizationId,
        user_id: userId,
        role
      })
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to update member role' };
    }

  } catch (error) {
    console.error('Error updating member role:', error);
    return { success: false, error: 'Failed to update member role' };
  }
}

/**
 * Remove member from organization
 */
export async function removeOrganizationMember(organizationId: string, userId: string): Promise<ApiResponse<boolean>> {
  try {
    const result = await apiCallJson<boolean>(`/api/superadmin/organizations/members?organizationId=${organizationId}&userId=${userId}`, {
      method: 'DELETE'
    });
    
    if (result.success) {
      return { success: true, data: true };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to remove member' };
    }

  } catch (error) {
    console.error('Error removing member:', error);
    return { success: false, error: 'Failed to remove member' };
  }
}
