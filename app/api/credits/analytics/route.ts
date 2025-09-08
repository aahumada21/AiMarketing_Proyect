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

    // Get organization wallet
    const { data: wallet, error: walletError } = await supabase
      .from('org_wallets')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Error getting wallet:', walletError);
      return NextResponse.json({ error: 'Failed to get wallet' }, { status: 500 });
    }

    // Get recent credit transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('credits_ledger')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (transactionsError) {
      console.error('Error getting transactions:', transactionsError);
      return NextResponse.json({ error: 'Failed to get transactions' }, { status: 500 });
    }

    // Get credits per video setting
    const { data: setting, error: settingError } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'credits_per_video')
      .single();

    const creditsPerVideo = setting?.value ? parseInt(setting.value) : 10;

    const analytics = {
      current_credits: wallet?.credits || 0,
      credits_per_video: creditsPerVideo,
      recent_transactions: transactions || []
    };

    return NextResponse.json({ success: true, data: analytics });

  } catch (error) {
    console.error('Error in credits analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
