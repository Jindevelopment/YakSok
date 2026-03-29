import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=kr`,
    {
      headers: {
        'User-Agent': 'YakSok/1.0 (capstone project)',
        'Accept-Language': 'ko',
      },
    }
  )

  const data = await res.json()

  if (!data.length) {
    return NextResponse.json({ addresses: [] })
  }

  return NextResponse.json({
    addresses: [{ x: data[0].lon, y: data[0].lat }],
  })
}
