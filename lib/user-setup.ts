// User setup utilities for first-time users

import { createClient } from '@/lib/supabase/client';
import { createUserProfile } from './auth';
import type { User } from '@supabase/supabase-js';

export async function setupNewUser(user: User): Promise<boolean> {
  const supabase = createClient();
  
  try {
    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (existingProfile) {
      console.log('User profile already exists');
      return true;
    }
    
    // Create user profile
    const profile = await createUserProfile(
      user.id, 
      user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
    );
    
    if (!profile) {
      console.error('Failed to create user profile');
      return false;
    }
    
    console.log('User profile created successfully');
    return true;
  } catch (error) {
    console.error('Error setting up new user:', error);
    return false;
  }
}

export async function checkUserSetup(user: User): Promise<{
  hasProfile: boolean;
  hasOrganizations: boolean;
  needsSetup: boolean;
}> {
  const supabase = createClient();
  
  try {
    // Check if user has a profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    const hasProfile = !!profile;
    
    // Check if user has any organization memberships
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id);
    
    const hasOrganizations = !!(memberships && memberships.length > 0);
    
    return {
      hasProfile,
      hasOrganizations,
      needsSetup: !hasProfile || !hasOrganizations
    };
  } catch (error) {
    console.error('Error checking user setup:', error);
    return {
      hasProfile: false,
      hasOrganizations: false,
      needsSetup: true
    };
  }
}
