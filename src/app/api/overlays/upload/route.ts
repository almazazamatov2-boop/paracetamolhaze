import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = process.env.KV_REST_API_URL ? new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN!,
}) : (process.env.UPSTASH_REDIS_REST_URL ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null);

export async function POST(req: NextRequest) {
  try {
    if (!redis) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    const token = req.cookies.get('twitch_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized (no token)' }, { status: 401 });

    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: 'Server config missing (Client ID)' }, { status: 500 });

    const authRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: { 'Authorization': `Bearer ${token}`, 'Client-Id': clientId },
    });
    const authData = await authRes.json();
    if (!authRes.ok || !authData.data?.[0]) {
      return NextResponse.json({ error: 'Twitch auth failed: ' + (authData.message || 'Unknown error') }, { status: 401 });
    }
  
    const userId = authData.data[0].id;

    const formData = await req.formData();
    const file = formData.get('asset') as File;
    const key = formData.get('key') as string;

    if (!file || !key) return NextResponse.json({ error: 'Missing file/key' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    // Using global Buffer instead of importing
    const base64 = typeof Buffer !== 'undefined' 
      ? Buffer.from(buffer).toString('base64')
      : btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;

    await redis.hset(`overlay:assets:${userId}`, { [key]: dataUrl });

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const assets = await redis.hgetall(`overlay:assets:${userId}`);
  return NextResponse.json(assets || {});
}
