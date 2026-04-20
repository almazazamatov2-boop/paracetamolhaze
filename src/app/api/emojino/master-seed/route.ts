import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const KP_API_KEY = '9376200e-5090-448f-93f2-4e8b4ccbde6b';
const KP_BASE = 'https://kinopoiskapiunofficial.tech/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Эмодзи по жанрам
const genreEmojis: Record<string, string[]> = {
  'боевик': ['🔫', '💣', '💥', '👊', '🚁', '🔥', '🚔', '💨'],
  'драма': ['🥀', '💔', '🎭', '✉️', '🎻', '🫂', '📜', '🌑'],
  'комедия': ['😂', '🤪', '🤡', '🍕', '🎉', '🤣', '🍺', '🍌'],
  'хоррор': ['👻', '🌑', '🔪', '🏚️', '🩸', '😱', '🕯️', '👣'],
  'фантастика': ['🚀', '🛸', '🪐', '🤖', '🛰️', '🧬', '🌌', '🔭'],
  'фэнтези': ['🧙‍♂️', '🐉', '⚔️', '🦄', '🏰', '✨', '🪙', '📜'],
  'триллер': ['🕵️‍♂️', '🔍', '🔍', '🥃', '⚖️', '👣', '⛓️', '🌑'],
  'мультфильм': ['🎨', '🎈', '🧸', '🍭', '🌈', '🍿', '🎡', '🏰'],
  'default': ['🎬', '🍿', '🎞️', '🎥', '📽️', '🎭', '🌟', '🎟️']
};

// Словарь "кино-ребусов" для топ-фильмов и сериалов
const movieSpecificEmojis: Record<string, string> = {
  // Фильмы
  "Побег из Шоушенка": "🧱🔨📖⚖️",
  "Зеленая миля": "🐁⚡️💧🙌",
  "Форрест Гамп": "🏃‍♂️🍫🍱🦐",
  "Список Шиндлера": "📜🧥👧🕯️",
  "Интерстеллар": "🚀🪐⏳📡",
  "Начало": "🌀💭🏙️💤",
  "Бойцовский клуб": "👊🧼🏢🕴️",
  "Матрица": "🕶️💊⌨️🔫",
  "Властелин колец": "💍🏔️⚔️👁️",
  "Гарри Поттер": "🧙‍♂️⚡️🏰👓",
  "Крестный отец": "🍷🔫🕴️🌹",
  "Леон": "🪴🔫🕶️🥛",
  "Назад в будущее": "🚗⚡️🕰️🔥",
  "Криминальное чтиво": "🍔🔫🕴️💼",
  "Титаник": "🚢🧊🌊💔",
  "Гладиатор": "⚔️🏟️🛡️🏛️",
  "Пираты Карибского моря": "🏴‍☠️⚔️🦜🏝️",
  "Темный рыцарь": "🦇🤡🃏🏢",
  "Аватар": "🏹🌕🦕🧬",
  "Звездные войны": "⚔️✨🚀🛰️",
  "Мстители": "🛡️🔨🏗️💥",
  "Парк Юрского периода": "🧪🦖🌋🧬",
  "Челюсти": "🦈🌊🏊‍♂️🚤",
  "Психо": "🔪🚿🏨😱",
  "Один дома": "👦🏠🎄🕸️",
  "Шрек": "👹🐌🏰🧅",
  "Король Лев": "🦁👑🌅🐾",

  // Сериалы
  "Во все тяжкие": "🧪🚐💎🚬",
  "Игра престолов": "⚔️🐉❄️👑",
  "Шерлок": "🕵️‍♂️🔍🎻🏢",
  "Черное зеркало": "📱👁️🖤🖥️",
  "Очень странные дела": "🚲🔦🎄👹",
  "Ведьмак": "⚔️🐺🔮🐎",
  "Офис": "📄👔☕️📦",
  "Друзья": "☕️🛋️🏙️🎻",
  "Настоящий детектив": "🕵️‍♂️🌾🔍🌑",
  "Фарго": "❄️🪓🩸📠",
  "Мандалорец": "🤖🛸🛡️👶",
  "Пацаны": "🦸‍♂️🧪🩸💊",
  "Бумажный дом": "🎭💰🏦🎒",
  "Твин Пикс": "🦉☕️🌲🥧",
  "Секретные материалы": "👽🛸🔦📂",
  "Доктор Хаус": "💊🦯🏥👨‍⚕️",
  "Сверхъестественное": "👻🔫🚗⚔️",
  "Симпсоны": "🍩📺👨‍👩‍👧‍👦🏠",
  "Слово пацана": "🧤🧢❄️🤜",
  "Метод": "🧐🔪🧪🩸",
  "Кухня": "👨‍🍳🔪🥗🥘",
  "Мажор": "🚔💰💎🍷",
  "Бригада": "🔫🚗⛓️👊",
  "Бандитский Петербург": "⛓️🌃🏛️🎻"
};

const getEmojiSequence = (title: string, genre: string, seed: number) => {
  // 1. Прямое совпадение из словаря
  if (movieSpecificEmojis[title]) return movieSpecificEmojis[title];

  // 2. Поиск по ключевым словам в названии
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('паук')) return "🕸️🕷️💪🏙️";
  if (lowerTitle.includes('бетмен') || lowerTitle.includes('бэтмен')) return "🦇🦇🌑🌃";
  if (lowerTitle.includes('войн')) return "⚔️💥💣🛡️";
  if (lowerTitle.includes('ужас') || lowerTitle.includes('кошмар')) return "😱👻🔪🩸";
  if (lowerTitle.includes('космос') || lowerTitle.includes('звезд')) return "🚀✨☄️🪐";
  if (lowerTitle.includes('любовь') || lowerTitle.includes('сердце')) return "❤️👩‍❤️‍👨🌹✨";
  if (lowerTitle.includes('собака') || lowerTitle.includes('пес')) return "🐕🐾🦴🎾";
  if (lowerTitle.includes('кот') || lowerTitle.includes('кошк')) return "🐈🐾🐟🧶";
  if (lowerTitle.includes('машин') || lowerTitle.includes('гонк')) return "🚗💨🔥🏁";

  // 3. Фолбэк на жанровую цепочку (улучшенная)
  const g = genre?.toLowerCase() || 'default';
  const pool = genreEmojis[g] || genreEmojis['default'];
  const shuffled = [...pool].sort(() => Math.sin(seed) * 10000 % 1);
  const length = 4 + (seed % 3); // 4-6 более компактных
  return shuffled.slice(0, length).join('');
};

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchFromKP(endpoint: string) {
  const res = await fetch(`${KP_BASE}${endpoint}`, {
    headers: { 'X-API-KEY': KP_API_KEY, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`KP API Error: ${res.status} on ${endpoint}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const results = {
    added: 0,
    errors: [] as string[],
    duration: 0
  };

  try {
    console.log('--- Starting Master Migration for Emojino ---');
    
    // 1. Получаем список фильмов (ТОП 250 фильмов + ТОП 250 сериалов = 500)
    const movieIds: { id: number, type: 'film' | 'serial' }[] = [];
    
    // ТОП 250 Лучших фильмов
    for (let p = 1; p <= 13; p++) {
      const data = await fetchFromKP(`/v2.2/films/top?type=TOP_250_BEST_FILMS&page=${p}`);
      (data.films || []).forEach((f: any) => movieIds.push({ id: f.filmId, type: 'film' }));
      await sleep(50); 
    }

    // ТОП сериалов
    for (let p = 1; p <= 13; p++) {
      const data = await fetchFromKP(`/v2.2/films?order=RATING&type=TV_SERIES&ratingFrom=8&ratingTo=10&page=${p}`);
      (data.items || []).forEach((f: any) => movieIds.push({ id: f.kinopoiskId, type: 'serial' }));
      await sleep(50);
    }
    
    const limit = 495;
    const finalIds = movieIds.slice(0, limit);

    // 2. Очищаем целевую таблицу перед миграцией
    await supabase.from('emojino_movies').delete().neq('id', '0');

    // 3. Обработка ПАЧКАМИ
    const workersCount = 5;
    
    const processMovie = async (item: { id: number, type: 'film' | 'serial' }, idx: number) => {
      try {
        const details = await fetchFromKP(`/v2.2/films/${item.id}`);
        const staff = await fetchFromKP(`/v1/staff?filmId=${item.id}`);
        
        const secondActor = staff
          .filter((s: any) => s.professionKey === 'ACTOR')
          .slice(1, 2)[0]?.nameRu || "Известный актер";

        const titleRu = details.nameRu || details.nameEn || 'Unknown';
        const genre = details.genres?.[0]?.genre || 'Кино';
        const year = details.year || 'Неизвестно';
        
        const hints = [
          `${year} год`,
          `${genre.charAt(0).toUpperCase() + genre.slice(1)}`,
          `${secondActor}`
        ];

        return {
          id: `kp-${item.id}`,
          title_ru: titleRu,
          type: item.type,
          year: parseInt(details.year) || null,
          emoji: getEmojiSequence(titleRu, genre, idx),
          hints: hints
        };
      } catch (e: any) {
        results.errors.push(`ID ${item.id}: ${e.message}`);
        return null;
      }
    };

    // Запускаем воркеров
    for (let i = 0; i < finalIds.length; i += workersCount) {
      const batch = finalIds.slice(i, i + workersCount);
      const processed = await Promise.all(batch.map((item, bIdx) => processMovie(item, i + bIdx)));
      const valid = processed.filter(m => m !== null);
      
      // Вставка в базу пачкой
      if (valid.length > 0) {
        const { error: insError } = await supabase.from('emojino_movies').insert(valid);
        if (insError) results.errors.push(`Insert Error: ${insError.message}`);
        results.added += valid.length;
      }
      
      console.log(`Progress: ${i + batch.length}/${finalIds.length} processed...`);
      await sleep(200); // Небольшая пауза между пачками
    }

    results.duration = (Date.now() - startTime) / 1000;

    return NextResponse.json({
      success: true,
      summary: results,
      message: `Successfully migrated ${results.added} movies in ${results.duration.toFixed(1)}s.`
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
