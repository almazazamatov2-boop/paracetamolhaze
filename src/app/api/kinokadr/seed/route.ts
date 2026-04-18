import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const API_KEY = '5ee2ab49-8a04-436d-ae88-cf6943b51018';
const BASE = 'https://kinopoiskapiunofficial.tech/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get('page') || '1';
  let type = searchParams.get('type') || 'TOP_250_BEST_FILMS';
  const cat = searchParams.get('cat') || 'films';

  try {
    const isTopSeries = type === 'TOP_250_TV_SHOWS';
    let url = `${BASE}/v2.2/films/top?type=${type}&page=${page}`;
    
    // Если Топ Сериалов - используем фильтрованный поиск вместо топа
    if (isTopSeries) {
      url = `${BASE}/v2.2/films?order=RATING&type=TV_SERIES&ratingFrom=8&ratingTo=10&page=${page}`;
    } else if (cat === 'series') {
      url = `${BASE}/v2.2/films?order=NUM_VOTE&type=TV_SERIES&page=${page}`;
    }

    const listRes = await fetch(url, {
      headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
    });
    const listData = await listRes.json();

    const items = listData.films || listData.items;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items found', data: listData });
    }

    const results = [];

    for (const item of items) {
      const filmId = item.filmId || item.kinopoiskId;
      const movieData = {
        id: `kp-${filmId}`,
        title: item.nameEn || item.nameRu || 'Unknown',
        title_ru: item.nameRu || item.nameEn || 'Без названия',
        image_url: item.posterUrl,
        type: (item.type === 'TV_SERIES' || item.type === 'TV_SHOW' || cat === 'series' || isTopSeries) ? 'series' : 'movie',
        category: (item.genres && item.genres[0]) ? item.genres[0].genre : 'Кино',
        year: parseInt(item.year) || null
      };

      const { error } = await supabase
        .from('kinokadr_movies')
        .upsert(movieData, { onConflict: 'id' });

      results.push({ 
        title: movieData.title_ru, 
        status: error ? 'error' : 'success'
      });
    }

    return NextResponse.json({
      message: `Processed page ${page} of ${isTopSeries ? 'Best Series' : type}`,
      count: results.length,
      results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
