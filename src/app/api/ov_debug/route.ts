import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return NextResponse.json({ 
      error: "Ключи Supabase отсутствуют в переменных окружения Vercel!",
      url_exists: !!url,
      key_exists: !!key
    });
  }

  const supabase = createClient(url, key);
  
  try {
    const { data, error } = await supabase.from('overlay_configs').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return NextResponse.json({ 
      status: "Связь с базой установлена", 
      table: "overlay_configs",
      count: data
    });
  } catch (err: any) {
    return NextResponse.json({ 
      error: "Ошибка при запросе к таблице overlay_configs", 
      details: err.message,
      hint: "Возможно, таблица называется иначе или у нее нет колонки user_id"
    });
  }
}
