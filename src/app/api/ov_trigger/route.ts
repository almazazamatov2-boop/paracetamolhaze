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

  if (!data) return NextResponse.json({});

  // Detect whichever trigger is newer (from dedicated column or legacy assets field)
  const trigger1 = (typeof data.trigger === 'string' ? JSON.parse(data.trigger || '{}') : data.trigger) || {};
  const trigger2 = (typeof data.assets?.last_trigger === 'string' ? JSON.parse(data.assets?.last_trigger || '{}') : data.assets?.last_trigger) || {};
  
  let finalTrigger = trigger1;
  if ((trigger2.timestamp || 0) > (trigger1.timestamp || 0)) {
    finalTrigger = trigger2;
  }

  return NextResponse.json(finalTrigger || {}, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}
