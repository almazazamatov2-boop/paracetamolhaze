import { NextRequest, NextResponse } from 'next/server'

const API_KEY = '9376200e-5090-448f-93f2-4e8b4ccbde6b'
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
