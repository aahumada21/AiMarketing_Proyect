// Client-side superadmin utilities that use API routes

import { apiCallJson } from '@/lib/api-client';
import type { Organization, OrgPlan, OrgStatus, ApiResponse } from './types';

interface CreateOrganizationForm {
  name: string;
  description: string;
  plan: OrgPlan;
  status: OrgStatus;
}

interface OrganizationWithDetails extends Organization {
  members_count: number;
  projects_count: number;
  current_credits: number;
}

/**
 * Get all organizations (superadmin only)
 */
export async function getAllOrganizations(): Promise<ApiResponse<OrganizationWithDetails[]>> {
  try {
    const result = await apiCallJson<OrganizationWithDetails[]>('/api/superadmin/organizations', {
      method: 'GET'
    });
    
    if (result.success) {
      return { success: true, data: result.data || [] };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to get organizations' };
    }

  } catch (error) {
    console.error('Error getting organizations:', error);
    return { success: false, error: 'Failed to get organizations' };
  }
}

/**
 * Create new organization (superadmin only)
 */
export async function createOrganization(form: CreateOrganizationForm): Promise<ApiResponse<Organization>> {
  try {
    const result = await apiCallJson<Organization>('/api/superadmin/organizations', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to create organization' };
    }

  } catch (error) {
    console.error('Error creating organization:', error);
    return { success: false, error: 'Failed to create organization' };
  }
}

/**
 * Update organization (superadmin only)
 */
export async function updateOrganization(id: string, form: CreateOrganizationForm): Promise<ApiResponse<Organization>> {
  try {
    const result = await apiCallJson<Organization>('/api/superadmin/organizations', {
      method: 'PUT',
      body: JSON.stringify({ id, ...form })
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to update organization' };
    }

  } catch (error) {
    console.error('Error updating organization:', error);
    return { success: false, error: 'Failed to update organization' };
  }
}

/**
 * Delete organization (superadmin only)
 */
export async function deleteOrganization(id: string): Promise<ApiResponse<boolean>> {
  try {
    const result = await apiCallJson<boolean>(`/api/superadmin/organizations?id=${id}`, {
      method: 'DELETE'
    });
    
    if (result.success) {
      return { success: true, data: true };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to delete organization' };
    }

  } catch (error) {
    console.error('Error deleting organization:', error);
    return { success: false, error: 'Failed to delete organization' };
  }
}
