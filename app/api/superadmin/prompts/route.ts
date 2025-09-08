import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/superadmin/prompts - Starting request');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('GET /api/superadmin/prompts - No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createServerAdminClient();

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('GET /api/superadmin/prompts - Auth error:', authError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('GET /api/superadmin/prompts - User authenticated:', user.id);

    // Check if user is superadmin
    const { data: superadminCheck, error: superadminError } = await supabase
      .from('organization_members')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .limit(1);

    console.log('GET /api/superadmin/prompts - Superadmin check:', { 
      superadminCheck, 
      superadminError,
      user_id: user.id 
    });

    if (superadminError) {
      console.error('GET /api/superadmin/prompts - Superadmin check error:', superadminError);
      return NextResponse.json({ 
        error: 'Failed to verify superadmin status', 
        details: superadminError.message 
      }, { status: 500 });
    }

    if (!superadminCheck || superadminCheck.length === 0) {
      console.log('GET /api/superadmin/prompts - User is not superadmin');
      return NextResponse.json({ 
        error: 'Superadmin access required',
        user_id: user.id,
        memberships: superadminCheck
      }, { status: 403 });
    }

    // Get all global prompts
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .eq('scope', 'global')
      .order('created_at', { ascending: false });

    console.log('GET /api/superadmin/prompts - Prompts query:', { 
      prompts: prompts?.length || 0, 
      promptsError 
    });

    if (promptsError) {
      console.error('GET /api/superadmin/prompts - Prompts error:', promptsError);
      return NextResponse.json({ 
        error: 'Failed to get prompts',
        details: promptsError.message
      }, { status: 500 });
    }

    console.log('GET /api/superadmin/prompts - Success:', prompts?.length || 0, 'prompts found');
    return NextResponse.json({ success: true, data: prompts || [] });

  } catch (error) {
    console.error('GET /api/superadmin/prompts - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/superadmin/prompts - Starting request');
    
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
    const { scope, title, description, content, variables } = body;

    // Create new prompt
    const { data: prompt, error: createError } = await supabase
      .from('prompts')
      .insert({
        scope,
        title,
        description,
        content,
        variables,
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('POST /api/superadmin/prompts - Create error:', createError);
      return NextResponse.json({ 
        error: 'Failed to create prompt',
        details: createError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: prompt });

  } catch (error) {
    console.error('POST /api/superadmin/prompts - Unexpected error:', error);
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
    const { id, title, description, content, variables, version, is_published } = body;

    // Update prompt
    const { data: prompt, error: updateError } = await supabase
      .from('prompts')
      .update({
        title,
        description,
        content,
        variables,
        version,
        is_published
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('PUT /api/superadmin/prompts - Update error:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update prompt',
        details: updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: prompt });

  } catch (error) {
    console.error('PUT /api/superadmin/prompts - Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
