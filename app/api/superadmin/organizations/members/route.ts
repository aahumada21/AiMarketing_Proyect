import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/superadmin/organizations/members - Starting request');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('GET /api/superadmin/organizations/members - No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerAdminClient();

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('GET /api/superadmin/organizations/members - Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('GET /api/superadmin/organizations/members - User authenticated:', user.id);

    // Check if user is superadmin
    const { data: superadminCheck, error: superadminError } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .limit(1);

    console.log('GET /api/superadmin/organizations/members - Superadmin check:', { 
      superadminCheck, 
      superadminError,
      user_id: user.id 
    });

    if (superadminError) {
      console.error('GET /api/superadmin/organizations/members - Superadmin check error:', superadminError);
      return NextResponse.json({ 
        error: 'Failed to verify superadmin status', 
        details: superadminError.message 
      }, { status: 500 });
    }

    if (!superadminCheck || superadminCheck.length === 0) {
      console.log('GET /api/superadmin/organizations/members - User is not superadmin');
      return NextResponse.json({ 
        error: 'Superadmin access required',
        user_id: user.id,
        memberships: superadminCheck
      }, { status: 403 });
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get organization members first
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('GET /api/superadmin/organizations/members - Members error:', membersError);
      return NextResponse.json({ 
        error: 'Failed to get organization members',
        details: membersError.message
      }, { status: 500 });
    }

    // Get user profiles for each member
    const members: any[] = [];
    for (const member of membersData || []) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_id', member.user_id)
        .single();

      members.push({
        ...member,
        profiles: profile || { user_id: member.user_id, full_name: null, avatar_url: null }
      });
    }

    console.log('GET /api/superadmin/organizations/members - Success:', members?.length || 0, 'members found');
    return NextResponse.json({ success: true, data: members || [] });

  } catch (error) {
    console.error('GET /api/superadmin/organizations/members - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/superadmin/organizations/members - Starting request');
    
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

    // Check if user is superadmin
    const { data: superadminCheck, error: superadminError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .limit(1);

    if (superadminError || !superadminCheck || superadminCheck.length === 0) {
      return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { organization_id, user_id, role } = body;

    // Add member to organization
    const { data: memberData, error: createError } = await supabase
      .from('organization_members')
      .insert({
        organization_id,
        user_id,
        role
      })
      .select('*')
      .single();

    if (createError) {
      console.error('POST /api/superadmin/organizations/members - Create error:', createError);
      return NextResponse.json({ 
        error: 'Failed to add member',
        details: createError.message
      }, { status: 500 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .eq('user_id', user_id)
      .single();

    const member = {
      ...memberData,
      profiles: profile || { user_id, full_name: null, avatar_url: null }
    };

    return NextResponse.json({ success: true, data: member });

  } catch (error) {
    console.error('POST /api/superadmin/organizations/members - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    // Check if user is superadmin
    const { data: superadminCheck, error: superadminError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .limit(1);

    if (superadminError || !superadminCheck || superadminCheck.length === 0) {
      return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { organization_id, user_id, role } = body;

    // Update member role
    const { data: memberData, error: updateError } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('organization_id', organization_id)
      .eq('user_id', user_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('PUT /api/superadmin/organizations/members - Update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update member',
        details: updateError.message
      }, { status: 500 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .eq('user_id', user_id)
      .single();

    const member = {
      ...memberData,
      profiles: profile || { user_id, full_name: null, avatar_url: null }
    };

    return NextResponse.json({ success: true, data: member });

  } catch (error) {
    console.error('PUT /api/superadmin/organizations/members - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Check if user is superadmin
    const { data: superadminCheck, error: superadminError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .limit(1);

    if (superadminError || !superadminCheck || superadminCheck.length === 0) {
      return NextResponse.json({ error: 'Superadmin access required' }, { status: 403 });
    }

    // Get organization ID and user ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');

    if (!organizationId || !userId) {
      return NextResponse.json({ error: 'Organization ID and User ID are required' }, { status: 400 });
    }

    // Remove member from organization
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('DELETE /api/superadmin/organizations/members - Delete error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to remove member',
        details: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE /api/superadmin/organizations/members - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
