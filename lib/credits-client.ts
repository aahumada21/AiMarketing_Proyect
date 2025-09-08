// Client-side credit utilities that use API routes

import { apiCallJson } from '@/lib/api-client';
import type { ApiResponse } from './types';

interface CreditsAnalytics {
  current_credits: number;
  credits_per_video: number;
  recent_transactions: any[];
}

/**
 * Get credits per video setting using API route
 */
export async function getCreditsPerVideo(): Promise<ApiResponse<number>> {
  try {
    const result = await apiCallJson<number>('/api/credits/per-video', {
      method: 'GET'
    });
    
    if (result.success) {
      return { success: true, data: result.data || 10 };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to get credits per video' };
    }

  } catch (error) {
    console.error('Error getting credits per video:', error);
    return { success: false, error: 'Failed to get credits per video' };
  }
}

/**
 * Get credits analytics using API route
 */
export async function getCreditsAnalytics(organizationId: string): Promise<ApiResponse<CreditsAnalytics>> {
  try {
    const result = await apiCallJson<CreditsAnalytics>(`/api/credits/analytics?organization_id=${organizationId}`, {
      method: 'GET'
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to get credits analytics' };
    }

  } catch (error) {
    console.error('Error getting credits analytics:', error);
    return { success: false, error: 'Failed to get credits analytics' };
  }
}
