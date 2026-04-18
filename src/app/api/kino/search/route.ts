import { NextRequest, NextResponse } from 'next/server'

const API_KEY = '9376200e-5090-448f-93f2-4e8b4ccbde6b'
const BASE = 'https://kinopoiskapiunofficial.tech/api'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') ?? ''
  if (!query.trim()) return NextResponse.json({ films: [] })

  const res = await fetch(
    `${BASE}/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`,
    { headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' } }
  )
  const data = await res.json()
  return NextResponse.json(data)
}
