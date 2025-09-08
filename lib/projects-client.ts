// Client-side project utilities that use API routes

import { apiCallJson } from '@/lib/api-client';
import type { Project, ApiResponse } from './types';

/**
 * Get organization projects using API route
 */
export async function getOrganizationProjects(organizationId: string): Promise<ApiResponse<Project[]>> {
  try {
    const result = await apiCallJson<Project[]>(`/api/organizations/projects?organization_id=${organizationId}`, {
      method: 'GET'
    });
    
    if (result.success) {
      return { success: true, data: result.data || [] };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to get projects' };
    }

  } catch (error) {
    console.error('Error getting organization projects:', error);
    return { success: false, error: 'Failed to get projects' };
  }
}
