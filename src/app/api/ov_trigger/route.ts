import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({});

  const { data, error } = await supabase
    .from('overlay_configs')
    .select('trigger')
    .eq('user_id', userId)
    .single();

  if (error || !data) return NextResponse.json(null);
  return NextResponse.json(data.trigger || null);
}
