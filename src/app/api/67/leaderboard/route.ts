import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '50');

    // Best score per user
    const bests = await db.gameRecord.groupBy({
      by: ['userId'],
      _max: { score: true, maxCombo: true, pumps: true },
      _count: { id: true },
    });

    const ids = bests.map((b) => b.userId);
    const users = await db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, login: true, image: true },
    });
    const uMap = new Map(users.map((u) => [u.id, u]));

    const lb = bests
      .map((b) => {
        const u = uMap.get(b.userId);
        return {
          username: u?.username || '???',
          login: u?.login || '',
          image: u?.image,
          bestScore: b._max.score || 0,
          maxCombo: b._max.maxCombo || 0,
          gamesPlayed: b._count.id,
        };
      })
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, limit)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return NextResponse.json({ success: true, leaderboard: lb });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}
