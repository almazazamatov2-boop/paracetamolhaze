import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('overlay_configs')
    .select('assets, trigger')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return NextResponse.json(null);

  // Try to find trigger in 'trigger' column or 'assets.last_trigger'
  let trigger = data.trigger;
  if (!trigger || Object.keys(trigger).length === 0) {
    trigger = data.assets?.last_trigger;
  }
  
  if (typeof trigger === 'string') {
    try { trigger = JSON.parse(trigger); } catch (e) {}
  }

  return new NextResponse(JSON.stringify(trigger || null), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}
