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

    // Get credits per video setting
    const { data: setting, error: settingError } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'credits_per_video')
      .single();

    if (settingError && settingError.code !== 'PGRST116') {
      console.error('Error getting credits per video setting:', settingError);
      return NextResponse.json({ error: 'Failed to get setting' }, { status: 500 });
    }

    const creditsPerVideo = setting?.value ? parseInt(setting.value) : 10;

    return NextResponse.json({ success: true, data: creditsPerVideo });

  } catch (error) {
    console.error('Error in credits per video API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
