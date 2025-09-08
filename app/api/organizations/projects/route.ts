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

    // Get organization_id from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get projects for the organization
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error getting projects:', projectsError);
      return NextResponse.json({ error: 'Failed to get projects' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: projects || [] });

  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
