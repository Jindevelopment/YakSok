import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { items: [], error: 'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경 변수를 설정해주세요.' },
      { status: 200 }
    )
  }

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lng = parseFloat(searchParams.get('lng') || '')

  // 좌표가 있으면 Nominatim으로 역지오코딩해서 지역명 추출
  let query = '약국'
  if (!isNaN(lat) && !isNaN(lng)) {
    try {
      const rgRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
        { headers: { 'User-Agent': 'YakSok/1.0 (capstone project)' } }
      )
      const rgData = await rgRes.json()
      const addr = rgData.address
      const area = addr?.suburb || addr?.quarter || addr?.neighbourhood || addr?.town || addr?.city_district || addr?.county || ''
      if (area) query = `약국 ${area}`
    } catch {
      // 역지오코딩 실패 시 '약국'으로 fallback
    }
  }

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=20&sort=random`,
    {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
      next: { revalidate: 0 },
    }
  )

  if (!res.ok) {
    return NextResponse.json({ items: [], error: '네이버 검색 API 오류' }, { status: 200 })
  }

  const data = await res.json()

  // mapx/mapy 는 WGS84 좌표 × 10^7 형식
  let items = (data.items as any[])
    .filter((item) => item.mapx && item.mapy)
    .map((item) => ({
      name: item.title.replace(/<[^>]+>/g, ''),
      address: item.address,
      roadAddress: item.roadAddress,
      telephone: item.telephone,
      lat: parseInt(item.mapy, 10) / 10_000_000,
      lng: parseInt(item.mapx, 10) / 10_000_000,
    }))

  // 좌표가 있으면 기준점에서 가까운 순으로 정렬
  if (!isNaN(lat) && !isNaN(lng)) {
    items = items.sort((a, b) => {
      const distA = Math.hypot(a.lat - lat, a.lng - lng)
      const distB = Math.hypot(b.lat - lat, b.lng - lng)
      return distA - distB
    })
  }

  return NextResponse.json({ items })
}
