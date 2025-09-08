import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/admin';

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

    // Get all organizations with details
    const { data: organizations, error: organizationsError } = await supabase
      .from('organizations')
      .select(`
        *,
        members:organization_members(count),
        projects:projects(count),
        wallet:org_wallets(*)
      `)
      .order('created_at', { ascending: false });

    if (organizationsError) {
      console.error('Error getting organizations:', organizationsError);
      return NextResponse.json({ error: 'Failed to get organizations' }, { status: 500 });
    }

    // Process organizations data
    const organizationsWithDetails = organizations?.map(org => ({
      ...org,
      members_count: org.members?.[0]?.count || 0,
      projects_count: org.projects?.[0]?.count || 0,
      current_credits: org.wallet?.[0]?.credits || 0
    })) || [];

    return NextResponse.json({ success: true, data: organizationsWithDetails });

  } catch (error) {
    console.error('Error in superadmin organizations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/superadmin/organizations - Starting request');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('POST /api/superadmin/organizations - No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerAdminClient();

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('POST /api/superadmin/organizations - Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('POST /api/superadmin/organizations - User authenticated:', user.id);

    // Check if user is superadmin
    const { data: superadminCheck, error: superadminError } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .limit(1);

    console.log('POST /api/superadmin/organizations - Superadmin check:', { 
      superadminCheck, 
      superadminError,
      user_id: user.id 
    });

    if (superadminError) {
      console.error('POST /api/superadmin/organizations - Superadmin check error:', superadminError);
      return NextResponse.json({ 
        error: 'Failed to verify superadmin status', 
        details: superadminError.message 
      }, { status: 500 });
    }

    if (!superadminCheck || superadminCheck.length === 0) {
      console.log('POST /api/superadmin/organizations - User is not superadmin');
      return NextResponse.json({ 
        error: 'Superadmin access required',
        user_id: user.id,
        memberships: superadminCheck
      }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { name, description, plan, status } = body;

    console.log('POST /api/superadmin/organizations - Creating organization:', { name, plan, status });

    // Create new organization
    const { data: organization, error: createError } = await supabase
      .from('organizations')
      .insert({
        name,
        description,
        plan,
        status
      })
      .select()
      .single();

    if (createError) {
      console.error('POST /api/superadmin/organizations - Create error:', createError);
      return NextResponse.json({ 
        error: 'Failed to create organization',
        details: createError.message
      }, { status: 500 });
    }

    console.log('POST /api/superadmin/organizations - Organization created successfully:', organization.id);
    return NextResponse.json({ success: true, data: organization });

  } catch (error) {
    console.error('POST /api/superadmin/organizations - Unexpected error:', error);
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

    // Get request body and organization ID
    const body = await request.json();
    const { id, name, description, plan, status } = body;

    // Update organization
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update({
        name,
        description,
        plan,
        status
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: organization });

  } catch (error) {
    console.error('Error in superadmin organizations PUT API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('id');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Delete organization
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (deleteError) {
      console.error('Error deleting organization:', deleteError);
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in superadmin organizations DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
