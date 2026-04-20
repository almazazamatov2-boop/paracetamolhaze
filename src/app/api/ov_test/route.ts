import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: configs } = await supabase
      .from('overlay_configs')
      .select('settings, assets, trigger')
      .eq('user_id', userId);

    const config = configs && configs.length > 0 ? configs[0] : null;
    const settings: any = config?.settings || {};
    const assets: any = config?.assets || {};
    const oldTrigger: any = config?.trigger || {};

    const userChoice = Math.floor(Math.random() * ((Number(settings.max_val) || 100) - (Number(settings.min_val) || 1) + 1)) + (Number(settings.min_val) || 1);

    const payload = {
      triggerId: Math.random().toString(36).substring(7),
      userName,
      userAvatar,
      userChoice,
      timestamp: Date.now(),
      isTest: true
    };

    // Store trigger in BOTH places to be 100% sure
    const { error: upsertError } = await supabase
      .from('overlay_configs')
      .upsert({ 
        user_id: userId, 
        assets: { ...assets, last_trigger: payload },
        settings: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
    return NextResponse.json({ success: true, payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
