import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Check if we can connect and list tables
    const { data, error } = await supabase.from('kinoquiz_movies').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ 
          success: false, 
          error: 'Table "kinoquiz_movies" does not exist. Please run the SQL migration.',
          code: error.code
        }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection healthy. Table "kinoquiz_movies" found.',
      sample_data: data
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
