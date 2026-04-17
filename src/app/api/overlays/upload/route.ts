import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get('twitch_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.TWITCH_CLIENT_ID;
  const authRes = await fetch('https://api.twitch.tv/helix/users', {
    headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId! },
  });
  const authData = await authRes.json();
  if (!authRes.ok || !authData.data?.[0]) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const userId = authData.data[0].id;
  
  try {
    const formData = await req.formData();
    const file = formData.get('asset') as File;
    const key = formData.get('key') as string;

    if (!file || !key) return NextResponse.json({ error: 'Missing file/key' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    await redis.hset(`overlay:assets:${userId}`, { [key]: dataUrl });

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const assets = await redis.hgetall(`overlay:assets:${userId}`);
  return NextResponse.json(assets || {});
}
