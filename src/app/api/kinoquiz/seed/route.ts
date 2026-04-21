import { NextResponse } from 'next/server';
import { kinoquizDb as db } from '@/lib/kinoquiz_db';

export async function GET() {
  try {
    const data = [
      // MOVIES - EASY (10)
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

      // SERIES - EASY (10)
      { title: 'Game of Thrones', title_ru: 'Игра престолов', type: 'series', difficulty: 'easy', year: 2011, imageUrl: 'https://images2.imgbox.com/8c/9d/6u3z7u0p_o.jpg' },
      { title: 'Breaking Bad', title_ru: 'Во все тяжкие', type: 'series', difficulty: 'easy', year: 2008, imageUrl: 'https://images2.imgbox.com/1a/2b/6u3z7u0p_o.jpg' },
      { title: 'Stranger Things', title_ru: 'Очень странные дела', type: 'series', difficulty: 'easy', year: 2016, imageUrl: 'https://images2.imgbox.com/3c/4d/6u3z7u0p_o.jpg' },
      { title: 'Sherlock', title_ru: 'Шерлок', type: 'series', difficulty: 'easy', year: 2010, imageUrl: 'https://images2.imgbox.com/5e/6f/6u3z7u0p_o.jpg' },
      { title: 'Chernobyl', title_ru: 'Чернобыль', type: 'series', difficulty: 'easy', year: 2019, imageUrl: 'https://images2.imgbox.com/7g/8h/6u3z7u0p_o.jpg' },
      { title: 'The Boys', title_ru: 'Пацаны', type: 'series', difficulty: 'easy', year: 2019, imageUrl: 'https://images2.imgbox.com/9i/0j/6u3z7u0p_o.jpg' },
      { title: 'Squid Game', title_ru: 'Игра в кальмара', type: 'series', difficulty: 'easy', year: 2021, imageUrl: 'https://images2.imgbox.com/1k/2l/6u3z7u0p_o.jpg' },
      { title: 'The Witcher', title_ru: 'Ведьмак', type: 'series', difficulty: 'easy', year: 2019, imageUrl: 'https://images2.imgbox.com/3m/4n/6u3z7u0p_o.jpg' },
      { title: 'Friends', title_ru: 'Друзья', type: 'series', difficulty: 'easy', year: 1994, imageUrl: 'https://images2.imgbox.com/5o/6p/6u3z7u0p_o.jpg' },
      { title: 'Black Mirror', title_ru: 'Черное зеркало', type: 'series', difficulty: 'easy', year: 2011, imageUrl: 'https://images2.imgbox.com/7q/8r/6u3z7u0p_o.jpg' },

      // ANIME - EASY (10)
      { title: 'Naruto', title_ru: 'Наруто', type: 'anime', difficulty: 'easy', year: 2002, imageUrl: 'https://images2.imgbox.com/9s/0t/6u3z7u0p_o.jpg' },
      { title: 'Death Note', title_ru: 'Тетрадь смерти', type: 'anime', difficulty: 'easy', year: 2006, imageUrl: 'https://images2.imgbox.com/1u/2v/6u3z7u0p_o.jpg' },
      { title: 'Attack on Titan', title_ru: 'Атака титанов', type: 'anime', difficulty: 'easy', year: 2013, imageUrl: 'https://images2.imgbox.com/3w/4x/6u3z7u0p_o.jpg' },
      { title: 'One Piece', title_ru: 'Ван Пис', type: 'anime', difficulty: 'easy', year: 1999, imageUrl: 'https://images2.imgbox.com/5y/6z/6u3z7u0p_o.jpg' },
      { title: 'Demon Slayer', title_ru: 'Истребитель демонов', type: 'anime', difficulty: 'easy', year: 2019, imageUrl: 'https://images2.imgbox.com/7a/8b/6u3z7u0p_o.jpg' },
      { title: 'Spirited Away', title_ru: 'Унесенные призраками', type: 'anime', difficulty: 'easy', year: 2001, imageUrl: 'https://images2.imgbox.com/9c/0d/6u3z7u0p_o.jpg' },
      { title: 'One Punch Man', title_ru: 'Ванпанчмен', type: 'anime', difficulty: 'easy', year: 2015, imageUrl: 'https://images2.imgbox.com/1e/2f/6u3z7u0p_o.jpg' },
      { title: 'Tokyo Ghoul', title_ru: 'Токийский гуль', type: 'anime', difficulty: 'easy', year: 2014, imageUrl: 'https://images2.imgbox.com/3g/4h/6u3z7u0p_o.jpg' },
      { title: 'Your Name', title_ru: 'Твое имя', type: 'anime', difficulty: 'easy', year: 2016, imageUrl: 'https://images2.imgbox.com/5i/6j/6u3z7u0p_o.jpg' },
      { title: 'Fullmetal Alchemist', title_ru: 'Стальной алхимик', type: 'anime', difficulty: 'easy', year: 2003, imageUrl: 'https://images2.imgbox.com/7k/8l/6u3z7u0p_o.jpg' }
    ];

    await db.kinoQuizMovie.deleteMany({});
    for (const item of data) {
      await db.kinoQuizMovie.create({ data: item });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
