// Client-side prompts utilities that use API routes

import { apiCallJson } from '@/lib/api-client';
import type { Prompt, CreatePromptForm, ApiResponse } from './types';

/**
 * Get all global prompts (superadmin only)
 */
export async function getGlobalPrompts(): Promise<ApiResponse<Prompt[]>> {
  try {
    const result = await apiCallJson<Prompt[]>('/api/superadmin/prompts', {
      method: 'GET'
    });
    
    if (result.success) {
      return { success: true, data: result.data || [] };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to get prompts' };
    }

  } catch (error) {
    console.error('Error getting prompts:', error);
    return { success: false, error: 'Failed to get prompts' };
  }
}

/**
 * Create new prompt (superadmin only)
 */
export async function createPrompt(form: CreatePromptForm): Promise<ApiResponse<Prompt>> {
  try {
    const result = await apiCallJson<Prompt>('/api/superadmin/prompts', {
      method: 'POST',
      body: JSON.stringify(form)
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to create prompt' };
    }

  } catch (error) {
    console.error('Error creating prompt:', error);
    return { success: false, error: 'Failed to create prompt' };
  }
}

/**
 * Update prompt (superadmin only)
 */
export async function updatePrompt(id: string, form: CreatePromptForm, version: number, is_published: boolean): Promise<ApiResponse<Prompt>> {
  try {
    const result = await apiCallJson<Prompt>('/api/superadmin/prompts', {
      method: 'PUT',
      body: JSON.stringify({ 
        id, 
        ...form, 
        version, 
        is_published 
      })
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      console.error('API returned error:', result.error);
      return { success: false, error: result.error || 'Failed to update prompt' };
    }

  } catch (error) {
    console.error('Error updating prompt:', error);
    return { success: false, error: 'Failed to update prompt' };
  }
}
