import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) return NextResponse.json({ error: "Ключи отсутствуют" });

  const supabase = createClient(url, key);
  
  try {
    const { data, error } = await supabase.from('overlay_configs').select('*').limit(1);
    if (error) throw error;
    
    if (data && data.length > 0) {
      return NextResponse.json({ 
        status: "Успех", 
        columns: Object.keys(data[0]),
        sample_data: data[0]
      });
    } else {
      return NextResponse.json({ 
        status: "Таблица пуста", 
        hint: "База доступна, но данных нет. Попробуй посмотреть названия колонок через Supabase Dashboard."
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
