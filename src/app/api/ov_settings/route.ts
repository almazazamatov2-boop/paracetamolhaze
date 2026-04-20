import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const { data, error } = await supabase
    .from('overlay_configs')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({});
  return NextResponse.json(data.settings || {});
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('twitch_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = process.env.TWITCH_CLIENT_ID;
    const authRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
    });
    const authData = await authRes.json();
    const userId = authData.data?.[0]?.id;
    if (!userId) return NextResponse.json({ error: 'Auth fail' }, { status: 401 });

    const body = await req.json();

    // Fetch existing to merge
    const { data: existing } = await supabase
      .from('overlay_configs')
      .select('assets, trigger')
      .eq('user_id', userId)
      .maybeSingle();

    const { error: upsertError } = await supabase
      .from('overlay_configs')
      .upsert({ 
        user_id: userId, 
        settings: body,
        updated_at: new Date().toISOString(),
        assets: existing?.assets || {},
        trigger: existing?.trigger || {}
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Supabase error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Fatal API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
