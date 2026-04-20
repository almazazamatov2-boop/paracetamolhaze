import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'fate';

    if (!userId) return NextResponse.json({ error: 'No user ID' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: config } = await supabase
        .from('overlay_configs')
        .select('settings, assets')
        .eq('user_id', userId)
        .maybeSingle();

    if (!config) return NextResponse.json({});

    const allSettings = config.settings || {};
    const assets = config.assets || {};
    
    // Merge assets into settings for convenience
    let settings = allSettings[type] || {};
    
    // Migration fallback for fate
    if (type === 'fate' && !settings && allSettings.reward_id) {
        settings = allSettings;
    }

    return NextResponse.json({ ...settings, ...assets });
}

export async function POST(req: Request) {
    const token = cookies().get('twitch_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = process.env.TWITCH_CLIENT_ID;
    const authRes = await fetch('https://api.twitch.tv/helix/users', {
        headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
    });
    const authData = await authRes.json();
    const userId = authData.data?.[0]?.id;
    if (!userId) return NextResponse.json({ error: 'Auth failed' }, { status: 401 });

    const { type, settings } = await req.json();
    if (!type || !settings) return NextResponse.json({ error: 'Missing type or settings' }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: current } = await supabase
        .from('overlay_configs')
        .select('settings, assets')
        .eq('user_id', userId)
        .maybeSingle();

    const allSettings = current?.settings || {};
    allSettings[type] = settings;

    const { error } = await supabase
        .from('overlay_configs')
        .upsert({
            user_id: userId,
            settings: allSettings,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
