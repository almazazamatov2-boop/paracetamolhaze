import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const type = req.nextUrl.searchParams.get('type'); // "fate" or "slots"
  if (!userId) return NextResponse.json({});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('overlay_configs')
    .select('settings')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return NextResponse.json({});
  const settings = data.settings || {};
  
  if (type) {
    // If we have type but it's not in the new format yet, return the root settings as "fate"
    if (type === 'fate' && !settings.fate && settings.reward_id) {
       return NextResponse.json(settings);
    }
    return NextResponse.json(settings[type] || {});
  }

  return NextResponse.json(settings);
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await req.json();
    const { type, ...settingsToSave } = body;

    const { data: configs } = await supabase
      .from('overlay_configs')
      .select('settings, assets')
      .eq('user_id', userId);
    
    const config = configs && configs.length > 0 ? configs[0] : null;
    let finalSettings = config?.settings || {};

    if (type) {
      finalSettings[type] = settingsToSave;
    } else {
      finalSettings = { ...finalSettings, ...settingsToSave };
    }

    const { error: upsertError } = await supabase
      .from('overlay_configs')
      .upsert({ 
        user_id: userId, 
        settings: finalSettings,
        assets: config?.assets || {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
