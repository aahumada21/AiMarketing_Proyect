import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/admin';
import type { UserContext, OrganizationWithDetails, Profile } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerAdminClient();

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error getting user profile:', profileError);
    }

    // If profile doesn't exist, create one
    let userProfile = profile;
    if (!profile && profileError?.code === 'PGRST116') {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          full_name: user.email || 'Usuario',
          avatar_url: null,
          timezone: 'UTC'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
      } else {
        userProfile = newProfile;
      }
    }

    // Get user organizations
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_members')
      .select(`
        role,
        organization:organizations(*)
      `)
      .eq('user_id', user.id);

    if (membershipsError) {
      console.error('Error getting user organizations:', membershipsError);
    }

    // Process organizations
    const organizations: OrganizationWithDetails[] = [];
    if (memberships) {
      for (const membership of memberships) {
        if (membership.organization) {
          // Get organization details
          const { data: orgDetails, error: orgError } = await supabase
            .from('organizations')
            .select(`
              *,
              members:organization_members(count),
              projects:projects(count)
            `)
            .eq('id', membership.organization.id)
            .single();

          if (!orgError && orgDetails) {
            organizations.push({
              ...orgDetails,
              user_role: membership.role,
              members_count: orgDetails.members?.[0]?.count || 0,
              projects_count: orgDetails.projects?.[0]?.count || 0
            });
          }
        }
      }
    }

    // Check if user is superadmin
    const { data: superadminCheck, error: superadminError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .limit(1);

    const isSuperadmin = !superadminError && superadminCheck && superadminCheck.length > 0;

    // Create user context
    const userContext: UserContext = {
      user: user,
      profile: userProfile,
      organizations: organizations,
      current_organization: organizations[0] || null,
      is_superadmin: isSuperadmin
    };

    return NextResponse.json({ success: true, data: userContext });

  } catch (error) {
    console.error('Error in user-context API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
