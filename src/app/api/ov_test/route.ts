import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('twitch_token')?.value;
  if (!token) return NextResponse.json({ error: 'Auth error' }, { status: 401 });

  const clientId = process.env.TWITCH_CLIENT_ID;
  const authRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
  });
  const authData = await authRes.json();
  if (!authRes.ok || !authData.data?.[0]) return NextResponse.json({ error: 'Twitch Auth Failed' }, { status: 401 });

  const userId = authData.data[0].id;
  const userName = authData.data[0].display_name;
  const userAvatar = authData.data[0].profile_image_url;

  const { data: config } = await supabase
    .from('overlay_configs')
    .select('settings')
    .eq('user_id', userId)
    .single();

  const settings: any = config?.settings || {};
  const userChoice = Math.floor(Math.random() * ((Number(settings.max_val) || 100) - (Number(settings.min_val) || 1) + 1)) + (Number(settings.min_val) || 1);

  const payload = {
    triggerId: Math.random().toString(36).substring(7),
    userName,
    userAvatar,
    userChoice,
    timestamp: Date.now(),
    isTest: true
  };

  const { error } = await supabase
    .from('overlay_configs')
    .upsert({ 
      user_id: userId, 
      trigger: payload,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
  return NextResponse.json({ success: true, payload });
}
