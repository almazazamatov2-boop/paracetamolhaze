import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Данные теперь берутся из @/data/movies
import { movies as sourceMovies } from '@/data/movies';

export async function GET() {
  try {
    // 1. Получаем все фильмы из kinokadr_movies
    const { data: dbMovies, error: fetchError } = await supabase
      .from('kinokadr_movies')
      .select('*');

    if (fetchError) throw fetchError;
    if (!dbMovies || dbMovies.length === 0) {
      return NextResponse.json({ error: 'Source table kinokadr_movies is empty!' }, { status: 404 });
    }

    console.log(`Found ${dbMovies.length} movies to migrate.`);

    // 2. Очищаем целевую таблицу
    await supabase.from('emojino_movies').delete().neq('id', '0');

    // Набор запасных эмодзи для разнообразия у неизвестных фильмов
    const genericEmojis = [
      '🎬🎞️🎥', '📽️🎭🍿', '📺⭐️🎬', '🌟🎥🎞️', '🎬🍿🎥', '🎞️📽️🎭'
    ];

    // 3. Подготавливаем данные для вставки
    const mappedMovies = dbMovies.map((m, idx) => {
      // Ищем совпадение в нашем списке (сначала точное, потом частичное)
      let source = sourceMovies.find(sm => sm.name.toLowerCase() === m.title_ru.toLowerCase());
      
      if (!source) {
        source = sourceMovies.find(sm => 
          m.title_ru.toLowerCase().includes(sm.name.toLowerCase()) ||
          sm.name.toLowerCase().includes(m.title_ru.toLowerCase())
        );
      }

      return {
        id: `m-${m.id}`,
        title_ru: m.title_ru,
        type: m.type === 'serial' ? 'serial' : 'film',
        year: m.year,
        emoji: source?.emoji || genericEmojis[idx % genericEmojis.length],
        hints: source?.hints && source.hints.length > 0 
          ? source.hints 
          : [`Вышел в ${m.year} году`, m.type === 'serial' ? 'Это популярный сериал' : 'Это известный фильм', 'Попробуй угадать!']
      };
    });

    // 4. Вставляем пачками по 100 штук
    const chunkSize = 100;
    for (let i = 0; i < mappedMovies.length; i += chunkSize) {
      const chunk = mappedMovies.slice(i, i + chunkSize);
      const { error: insertError } = await supabase
        .from('emojino_movies')
        .insert(chunk);
      
      if (insertError) {
        console.error(`Error inserting chunk ${i}:`, insertError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: mappedMovies.length,
      message: 'Migration completed successfully from kinokadr_movies.' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
