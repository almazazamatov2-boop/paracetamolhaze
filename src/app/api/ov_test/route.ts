import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getWeightedRandom(items: any[]) {
  if (!items || items.length === 0) return null;
  const totalWeight = items.reduce((acc, item) => acc + (Number(item.weight) || 1), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    const weight = Number(item.weight) || 1;
    if (random < weight) return item;
    random -= weight;
  }
  return items[0];
}

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

    const body = await req.json();
    const type = body.type || 'fate';

    const { data: configs } = await supabase
      .from('overlay_configs')
      .select('settings, assets')
      .eq('user_id', userId);

    const config = configs && configs.length > 0 ? configs[0] : null;
    const allSettings: any = config?.settings || {};
    const assets: any = config?.assets || {};
    
    let settings = allSettings[type];
    if (!settings && type === 'fate' && allSettings.reward_id) {
       settings = allSettings;
    }
    settings = settings || {};

    let payload: any = {
      triggerId: Math.random().toString(36).substring(7),
      userName,
      userAvatar,
      timestamp: Date.now(),
      isTest: true,
      type
    };

    if (type === 'slots') {
      const symbols = settings.symbols || [];
      if (symbols.length > 0) {
        payload.result = [
          getWeightedRandom(symbols).url,
          getWeightedRandom(symbols).url,
          getWeightedRandom(symbols).url
        ];
      } else {
        payload.result = ['', '', ''];
      }
    } else {
      // Fate (Roll) logic
      const min = Number(settings.min_val) || 1;
      const max = Number(settings.max_val) || 100;
      payload.userChoice = Math.floor(Math.random() * (max - min + 1)) + min;
      // In test, let's make it 30% chance to win for better visual feedback
      if (Math.random() < 0.3) {
        payload.result = payload.userChoice;
      } else {
        payload.result = Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }

    const { error: upsertError } = await supabase
      .from('overlay_configs')
      .upsert({ 
        user_id: userId, 
        assets: { ...assets, last_trigger: payload },
        settings: allSettings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
    return NextResponse.json({ success: true, payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
