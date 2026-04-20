import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const { data, error } = await supabase
    .from('overlay_configs')
    .select('assets')
    .eq('user_id', userId)
    .single();

  if (error || !data) return NextResponse.json({});
  return NextResponse.json(data.assets || {});
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('twitch_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.TWITCH_CLIENT_ID;
  const authRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
  });
  const authData = await authRes.json();
  const userId = authData.data?.[0]?.id;
  if (!userId) return NextResponse.json({ error: 'Auth fail' }, { status: 401 });

  const { key, asset } = await req.json();

  // Fetch current to merge (safe check)
  const { data: configs } = await supabase
    .from('overlay_configs')
    .select('settings, assets, trigger')
    .eq('user_id', userId);
  
  const current = configs && configs.length > 0 ? configs[0] : null;

  const baseAssets = current?.assets || {};
  const newAssets = { ...baseAssets, [key]: asset };

  const { error } = await supabase
    .from('overlay_configs')
    .upsert({ 
      user_id: userId, 
      assets: newAssets,
      settings: current?.settings || {},
      trigger: current?.trigger || {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
