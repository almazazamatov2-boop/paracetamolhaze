import { NextRequest, NextResponse } from 'next/server'

const API_KEY = '5ee2ab49-8a04-436d-ae88-cf6943b51018'
const BASE = 'https://kinopoiskapiunofficial.tech/api'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 })

  const res = await fetch(
    `${BASE}/v2.2/films/${id}`,
    { headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' } }
  )
  const data = await res.json()
  return NextResponse.json(data)
}
