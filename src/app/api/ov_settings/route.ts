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
    .single();

  if (error || !data) return NextResponse.json({});
  return NextResponse.json(data.settings || {});
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('twitch_token')?.value;
  if (!token) return NextResponse.json({ error: 'Auth fail' }, { status: 401 });

  const clientId = process.env.TWITCH_CLIENT_ID;
  const authRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
  });
  const authData = await authRes.json();
  const userId = authData.data?.[0]?.id;
  if (!userId) return NextResponse.json({ error: 'Auth fail' }, { status: 401 });

  const body = await req.json();

  // Fetch existing config (safe check)
  const { data: configs } = await supabase
    .from('overlay_configs')
    .select('assets, trigger')
    .eq('user_id', userId);
  
  const existing = configs && configs.length > 0 ? configs[0] : null;

  const { error } = await supabase
    .from('overlay_configs')
    .upsert({ 
      user_id: userId, 
      settings: body,
      assets: existing?.assets || {},
      trigger: existing?.trigger || {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });

  return NextResponse.json({ success: true });
}
