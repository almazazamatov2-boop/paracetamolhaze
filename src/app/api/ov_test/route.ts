import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getWeightedResult(settings: any) {
  const symbols = settings.symbols || [];
  const jackpot = settings.jackpot || { url: '', chance: 0.1 };
  
  const roll = Math.random() * 100;
  let cumulative = 0;

  // 1. Check Jackpot
  cumulative += Number(jackpot.chance) || 0;
  if (roll < cumulative) {
    return { result: [jackpot.url, jackpot.url, jackpot.url], isJackpot: true, isWin: true };
  }

  // 2. Check Symbols
  for (const s of symbols) {
    cumulative += Number(s.chance) || 0;
    if (roll < cumulative) {
      return { result: [s.url, s.url, s.url], isJackpot: false, isWin: true };
    }
  }

  // 3. Loss - Generate 3 random non-identical symbols
  // We need at least 2 different symbols to guarantee a loss
  const allUrls = symbols.map((s: any) => s.url);
  if (jackpot.url) allUrls.push(jackpot.url);
  
  // Fallback defaults if no symbols
  const pool = allUrls.length >= 2 ? allUrls : ['/overlays/defaults/slots/cherry.png', '/overlays/defaults/slots/lemon.png', '/overlays/defaults/slots/seven.png'];
  
  const r1 = pool[Math.floor(Math.random() * pool.length)];
  let r2 = pool[Math.floor(Math.random() * pool.length)];
  let r3 = pool[Math.floor(Math.random() * pool.length)];

  // Ensure it's not a win
  if (r1 === r2 && r2 === r3) {
    // Force r3 to be different
    r3 = pool.find(u => u !== r1) || pool[0];
  }

  return { result: [r1, r2, r3], isJackpot: false, isWin: false };
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
    const userId = authData.data?.[0]?.id;
    const userName = authData.data?.[0]?.display_name;
    const userAvatar = authData.data?.[0]?.profile_image_url;

    if (!userId) return NextResponse.json({ error: 'Auth fail' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await req.json();
    const type = body.type || 'slots';

    const { data: configs } = await supabase
      .from('overlay_configs')
      .select('settings, assets')
      .eq('user_id', userId);

    const config = configs?.[0] || null;
    const allSettings: any = config?.settings || {};
    const assets: any = config?.assets || {};
    
    let settings = allSettings[type] || {};
    // Migration fallback
    if (!settings && type === 'fate' && allSettings.reward_id) settings = allSettings;

    let payload: any = {
      triggerId: Math.random().toString(36).substring(7),
      userName,
      userAvatar,
      timestamp: Date.now(),
      isTest: true,
      type
    };

    if (type === 'slots') {
      const { result, isJackpot, isWin } = getWeightedResult(settings);
      payload.result = result;
      payload.isJackpot = isJackpot;
      payload.isWin = isWin;
    } else {
      // Fate (Roll) logic
      const min = Number(settings.min_val) || 1;
      const max = Number(settings.max_val) || 100;
      payload.userChoice = Math.floor(Math.random() * (max - min + 1)) + min;
      if (Math.random() < 0.3) {
        payload.result = payload.userChoice;
      } else {
        payload.result = Math.floor(Math.random() * (max - min + 1)) + min;
      }
    }

    await supabase
      .from('overlay_configs')
      .upsert({ 
        user_id: userId, 
        assets: { ...assets, last_trigger: payload },
        settings: allSettings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    return NextResponse.json({ success: true, payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
