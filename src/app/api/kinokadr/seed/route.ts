import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const API_KEY = '5ee2ab49-8a04-436d-ae88-cf6943b51018';
const BASE = 'https://kinopoiskapiunofficial.tech/api';

const IMDB_TITLES = [
  "Игра престолов", "Во все тяжкие", "Ходячие мертвецы", "Теория большого взрыва", "Шерлок", "Декстер", "Друзья", 
  "Как я встретил вашу маму", "Остаться в живых", "Побег", "Настоящий детектив", "Карточный домик", "Доктор Хаус", 
  "Стрела", "Сверхъестественное", "Симпсоны", "Американская семейка", "Форс-мажоры", "Гриффины", "Южный парк", 
  "Родина", "Дневники вампира", "Сорвиголова", "Задержка в развитии", "Настоящая кровь", "Герои", "Офис", 
  "Два с половиной человека", "Клиника", "Американская история ужасов", "Викинги", "Сопрано", "Прослушка", 
  "Оранжевый - хит сезона", "Светлячок", "Флэш", "Сыны анархии", "Грань", "Спартак: Кровь и песок", "Сайнфелд", 
  "Фарго", "Однажды в сказке", "Анатомия страсти", "Ганнибал", "Мистер Робот", "Футурама", "Лучше звоните Солу", 
  "Доктор Кто", "Секретные материалы", "24 часа", "Блудливая Калифорния", "Сообщество", "Безумцы", "Агенты Щ.И.Т.", 
  "Новенькая", "Подпольная империя", "Красавцы", "В Филадельфии всегда солнечно", "Готэм", "Менталист", 
  "Аватар: Легенда об Аанге", "В поле зрения", "Парки и зоны отдыха", "Звездный крейсер Галактика", "Касл", 
  "Лузеры", "Сплетница", "Милые обманщицы", "Шоу 70-х", "Рим", "Аббатство Даунтон", "Кости", "Нарко", "Тетрадь смерти", 
  "Мыслить как преступник", "Твин Пикс", "Чак", "Чёрный список", "Сотня", "Баффи - истребительница вампиров", 
  "Месть", "Бесстыжие", "Тайны Смолвилля", "Малкольм в центре внимания", "Белый воротничок", "Отчаянные домохозяйки", 
  "Студия 30", "Джессика Джонс", "Компьютерщики", "Хулиганы и ботаны", "Клиент всегда мертв", "Принц из Беверли-Хиллз", 
  "Оборотень", "Арчер", "Теория лжи", "Дурман", "Морская полиция: Спецотдел", "Американский папаша", "Под кудолом", 
  "Гримм", "Меня зовут Эрл", "Служба новостей", "Секс в большом городе", "Топ Гир", "Женаты и с детьми", 
  "Драконий жемчуг Зет", "Страшные сказки", "Древние", "Отбросы", "Рухнувшие небеса", "Последователи", "Элементарно", 
  "Революция", "Рик и Морти", "Две девицы на мели", "Очень странные дела", "Лютер", "Терра Нова", "Лейла и Меджнун", 
  "Тёмное дитя", "Офис", "Убийство", "Ясновидец", "C.S.I. Место преступления", "Тюрьма «ОZ»", "Умерь свой энтузиазм", 
  "Однажды в Калифорнии", "Легенда о Корре", "Дэдвуд", "Бруклин 9-9", "Восьмое чувство", "Звёздный путь: Следующее поколение", 
  "Атака титанов", "Правосудие", "Звёздные врата: ЗВ-1", "Девочки Гилмор", "Мистер Бин", "Бойтесь ходячих мертвецов", 
  "Демоны Да Винчи", "Силиконовая долина", "Король Квинса", "Как избежать наказания за убийство", "Молокососы", 
  "Чёрная метка", "Мотель Бейтсов", "Губка Боб квадратные штаны", "Луи", "Отель «Фолти Тауэрс»", "Чёрное зеркало", 
  "Холм одного дерева", "Острые козырьки", "Зачарованные", "Банши", "Мерлин", "Переростки", "Фрейзер", "Вероника Марс", 
  "Щит", "Вспомни, что будет", "Штамм", "Чёрные Паруса", "Закон и порядок: Специальный корпус", "Бэтмен", "Ковбой Бибоп", 
  "Скандал", "Ангел", "Терминатор: Битва за будущее", "Все любят Рэймонда", "Тюдоры", "Дефективный детектив", 
  "Стальной алхимик: Братство", "Чужестранка", "Звёздный путь", "Девочки", "Хорошая жена", "Агент Картер", 
  "Сонная Лощина", "Звёздные врата: Атлантида", "Люцифер", "Время приключений", "Иерихон", "Гавайи 5.0", "Части тела", 
  "Американцы", "Континуум", "Vизитeры", "Разрушители легенд", "Мертвые до востребования", "Рэй Донован", 
  "Монти Пайтон: Летающий цирк", "Сумеречная зона", "CSI: Место преступления Майами", "Западное крыло", 
  "Наруто: Ураганные хроники", "Супергёрл", "Огни ночной пятницы", "Летучие Конкорды", "Никита", "Убийство на пляже", 
  "На дне", "Полный дом", "Вечность", "Наруто", "Почти человек", "Создавая убийцу", "Массовка", "Книжный магазин Блэка", 
  "Драконий жемчуг", "Кукольный дом", "Ван-Пис", "Скорая помощь", "Долбанутые", "Эврика", "Реальные пацаны", 
  "Тайный круг", "Звёздные врата: Вселенная", "Борджиа", "Звёздный путь: Вояджер", "Марко Поло", "Стальной алхимик", 
  "Третья планета от Солнца", "Закусочная Боба", "Ад на колёсах", "Хранилище 13", "Крах", "Области тьмы", "Шпионка", 
  "Уэйуорд Пайнс", "Связь", "Трудоголики", "Оставленные", "Неуклюжая", "Лига", "Константин", "Уилл и Грейс", 
  "События Прошедшей Недели С Джоном Оливером", "Место преступления Нью-Йорк", "Говорящая с призраками", 
  "Беверли-Хиллз 90210: Новое поколение", "Четыре тысячи четыреста", "Джоуи", "Чёртова служба в госпитале МЭШ", 
  "Последний корабль", "Город хищниц", "Легенды завтрашнего дня", "Царь горы", "Уилфред", "Алькатрас", 
  "Морская полиция: Лос-Анджелес", "Дурнушка"
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const type = searchParams.get('type') || 'TOP_250_BEST_FILMS';
  const cat = searchParams.get('cat') || 'films';

  try {
    const results = [];

    // --- CASE 1: SEED FROM IMDB LIST (CUSTOM) ---
    if (cat === 'imdb') {
      const itemsPerPage = 20;
      const start = (page - 1) * itemsPerPage;
      const titlesSubset = IMDB_TITLES.slice(start, start + itemsPerPage);

      if (titlesSubset.length === 0) {
        return NextResponse.json({ error: 'No more titles in IMDB list' });
      }

      for (const title of titlesSubset) {
        // Поиск по названию
        const searchRes = await fetch(`${BASE}/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}&page=1`, {
          headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
        });
        const searchData = await searchRes.json();
        const film = searchData.films?.[0];

        if (film) {
          const movieData = {
            id: `kp-${film.filmId}`,
            title: film.nameEn || film.nameRu || 'Unknown',
            title_ru: film.nameRu || film.nameEn || 'Без названия',
            image_url: film.posterUrl,
            type: 'series', // Так как список - Top TV Series
            category: film.genres?.[0]?.genre || 'Сериал',
            year: parseInt(film.year) || null
          };

          const { error } = await supabase.from('kinokadr_movies').upsert(movieData, { onConflict: 'id' });
          results.push({ title, status: error ? 'error' : 'success' });
        } else {
          results.push({ title, status: 'not_found' });
        }
        // Маленький таймаут
        await new Promise(r => setTimeout(r, 200));
      }

      return NextResponse.json({ message: `Processed IMDB page ${page}`, results });
    }

    // --- CASE 2: KINOPOISK COLLECTIONS ---
    const isTopSeries = type === 'TOP_250_TV_SHOWS';
    let url = `${BASE}/v2.2/films/top?type=${type}&page=${page}`;
    
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

    foreach: for (const item of items) {
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

      const { error } = await supabase.from('kinokadr_movies').upsert(movieData, { onConflict: 'id' });
      results.push({ title: movieData.title_ru, status: error ? 'error' : 'success' });
    }

    return NextResponse.json({ message: `Processed ${type} page ${page}`, results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
