import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const data = [
      // MOVIES - EASY
      { title: 'Inception', title_ru: 'Начало', type: 'movie', difficulty: 'easy', year: 2010, imageUrl: 'https://images2.imgbox.com/39/5c/qO98U3B9_o.jpg' },
      { title: 'The Matrix', title_ru: 'Матрица', type: 'movie', difficulty: 'easy', year: 1999, imageUrl: 'https://images2.imgbox.com/64/46/78B1y0y7_o.jpg' },
      { title: 'Interstellar', title_ru: 'Интерстеллар', type: 'movie', difficulty: 'easy', year: 2014, imageUrl: 'https://images2.imgbox.com/00/7a/m3Z9W3z7_o.jpg' },
      { title: 'Joker', title_ru: 'Джокер', type: 'movie', difficulty: 'easy', year: 2019, imageUrl: 'https://images2.imgbox.com/9a/3c/6u3z7u0p_o.jpg' },
      { title: 'The Dark Knight', title_ru: 'Темный рыцарь', type: 'movie', difficulty: 'easy', year: 2008, imageUrl: 'https://images2.imgbox.com/6e/0a/6u3z7u0p_o.jpg' },
      { title: 'Pulp Fiction', title_ru: 'Криминальное чтиво', type: 'movie', difficulty: 'easy', year: 1994, imageUrl: 'https://images2.imgbox.com/2a/3b/6u3z7u0p_o.jpg' },
      { title: 'Fight Club', title_ru: 'Бойцовский клуб', type: 'movie', difficulty: 'easy', year: 1999, imageUrl: 'https://images2.imgbox.com/1c/2a/6u3z7u0p_o.jpg' },
      { title: 'Forrest Gump', title_ru: 'Форрест Гамп', type: 'movie', difficulty: 'easy', year: 1994, imageUrl: 'https://images2.imgbox.com/5d/4e/6u3z7u0p_o.jpg' },
      { title: 'Leon', title_ru: 'Леон', type: 'movie', difficulty: 'easy', year: 1994, imageUrl: 'https://images2.imgbox.com/4a/1c/6u3z7u0p_o.jpg' },
      { title: 'The Green Mile', title_ru: 'Зеленая миля', type: 'movie', difficulty: 'easy', year: 1999, imageUrl: 'https://images2.imgbox.com/3d/2f/6u3z7u0p_o.jpg' },
      
      // ... (more can be added via SQL)
    ];

    // Note: This requires the table 'kinoquiz_movies' to exist in Supabase
    const { error } = await supabase.from('kinoquiz_movies').upsert(data);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Seeds sent to Supabase. Make sure table "kinoquiz_movies" exists.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
