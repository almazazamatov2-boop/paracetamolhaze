import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';

  try {
    // Fetch 10 easy, 10 medium, 10 hard from Supabase
    // Table: kinoquiz_movies
    
    const { data: easy } = await supabase
      .from('kinoquiz_movies')
      .select('*')
      .eq('type', type)
      .eq('difficulty', 'easy')
      .limit(10);

    const { data: medium } = await supabase
      .from('kinoquiz_movies')
      .select('*')
      .eq('type', type)
      .eq('difficulty', 'medium')
      .limit(10);

    const { data: hard } = await supabase
      .from('kinoquiz_movies')
      .select('*')
      .eq('type', type)
      .eq('difficulty', 'hard')
      .limit(10);

    const movies = [...(easy || []), ...(medium || []), ...(hard || [])];

    // Fallback if DB is empty
    if (movies.length === 0) {
      return NextResponse.json({ 
        movies: Array.from({ length: 30 }).map((_, i) => ({
          id: `demo-${i}`,
          title: 'Demo Movie',
          title_ru: 'Демонстрационный фильм',
          imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1000',
          type,
          difficulty: i < 10 ? 'easy' : i < 20 ? 'medium' : 'hard',
          year: 2024
        }))
      });
    }

    return NextResponse.json({ movies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
