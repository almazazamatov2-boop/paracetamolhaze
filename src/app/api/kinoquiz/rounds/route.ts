import { NextResponse } from 'next/server';
import { kinoquizDb as db } from '@/lib/kinoquiz_db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'movie';

  try {
    // Fetch 10 easy, 10 medium, 10 hard
    const easy = await db.kinoQuizMovie.findMany({
      where: { type, difficulty: 'easy' },
      take: 10,
    });
    const medium = await db.kinoQuizMovie.findMany({
      where: { type, difficulty: 'medium' },
      take: 10,
    });
    const hard = await db.kinoQuizMovie.findMany({
      where: { type, difficulty: 'hard' },
      take: 10,
    });

    // Combine and shuffle if needed, but the user requested 10-10-10 sequence
    const movies = [...easy, ...medium, ...hard];

    return NextResponse.json({ movies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
