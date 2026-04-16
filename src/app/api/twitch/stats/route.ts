import { NextResponse } from 'next/server';

const API_BASE = 'https://followage.showmasterokda.com';

const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': 'https://followage.showmasterokda.com',
  'Referer': 'https://followage.showmasterokda.com/',
};

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/search_stats_api.php?action=get`, {
      headers: HEADERS,
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
