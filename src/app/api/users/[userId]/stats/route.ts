import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  return NextResponse.json(
    {
      user_id: userId,
      games_played: 0,
      games_won: 0,
      total_score: 0,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}

