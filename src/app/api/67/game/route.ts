import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Необходима авторизация через Twitch' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'Не найден профиль' }, { status: 401 });
    }

    const body = await request.json();
    const { score, pumps, maxCombo, avgSpeed, duration } = body;
    if (typeof score !== 'number' || typeof pumps !== 'number') {
      return NextResponse.json({ error: 'Некорректные данные' }, { status: 400 });
    }

    const record = await db.gameRecord.create({
      data: {
        userId,
        score: Math.round(score),
        pumps: Math.round(pumps),
        maxCombo: Math.round(maxCombo) || 0,
        avgSpeed: avgSpeed || 0,
        duration: duration || 30,
      },
    });

    // Count how many users have a better best score
    const allBests = await db.gameRecord.groupBy({
      by: ['userId'],
      _max: { score: true },
    });
    const betterCount = allBests.filter((b) => (b._max.score || 0) > record.score).length;

    return NextResponse.json({ success: true, rank: betterCount + 1 });
  } catch (error) {
    console.error('Game save error:', error);
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'Не найден профиль' }, { status: 401 });
    }

    const [totalGames, bestRow, bestComboRow, sumRow, recent] = await Promise.all([
      db.gameRecord.count({ where: { userId } }),
      db.gameRecord.findFirst({ where: { userId }, orderBy: { score: 'desc' } }),
      db.gameRecord.findFirst({ where: { userId }, orderBy: { maxCombo: 'desc' } }),
      db.gameRecord.aggregate({ where: { userId }, _sum: { pumps: true } }),
      db.gameRecord.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalGames,
        bestScore: bestRow?.score || 0,
        bestCombo: bestComboRow?.maxCombo || 0,
        totalPumps: sumRow._sum.pumps || 0,
      },
      history: recent.map((g) => ({
        id: g.id, score: g.score, pumps: g.pumps,
        maxCombo: g.maxCombo, avgSpeed: g.avgSpeed,
        createdAt: g.createdAt,
      })),
    });
  } catch (error) {
    console.error('Game history error:', error);
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}
