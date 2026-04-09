import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MEDICATION_COLUMNS = 'id,item_seq,item_name,entp_name,class_name,efficacy,usage_info,caution,side_effect,interaction_info,image_url,drug_shape,color_class1,color_class2,print_front,print_back,mark_code_front,mark_code_back,form_code_name,chart,created_at'

// 식약처 API에도 없을 때 Groq AI로 1줄 요약 생성
async function fetchAiSummary(itemName: string): Promise<{ efficacy?: string; side_effect?: string } | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content:
              '당신은 의약품 정보 전문가입니다. 약 이름이 주어지면 반드시 JSON 형식으로만 응답하세요. 추가 설명 없이 JSON만 출력하세요.',
          },
          {
            role: 'user',
            content: `"${itemName}" 의약품에 대해 아래 JSON 형식으로 각각 한 문장씩 요약해주세요:\n{"efficacy":"효능·효과 한 문장 요약","side_effect":"주요 부작용 한 문장 요약"}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const text: string = data?.choices?.[0]?.message?.content ?? ''
    const match = text.match(/\{[\s\S]*?\}/)
    if (!match) return null

    return JSON.parse(match[0]) as { efficacy?: string; side_effect?: string }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

  const supabase = await createClient()

  const { data: med } = await supabase
    .from('medications')
    .select(MEDICATION_COLUMNS)
    .eq('id', id)
    .single()

  if (!med) return NextResponse.json({ error: '약품을 찾을 수 없습니다' }, { status: 404 })

  // DB에 이미 정보 있으면 바로 반환
  if (med.efficacy) {
    return NextResponse.json({ medication: med, hasDetail: true, aiGenerated: false })
  }

  // 식약처 API 조회 시도
  if (med.item_seq) {
    const apiKey = process.env.MFDS_EASY_API_KEY ?? process.env.MFDS_API_KEY
    if (apiKey) {
      try {
        const url = new URL('https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList')
        url.searchParams.set('serviceKey', apiKey)
        url.searchParams.set('itemSeq', med.item_seq)
        url.searchParams.set('type', 'json')
        url.searchParams.set('numOfRows', '1')

        const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
        if (res.ok) {
          const json = await res.json()
          const items: Record<string, string>[] = json?.body?.items ?? []

          if (items.length > 0) {
            const item = items[0]
            const updates: Record<string, string | null> = {
              efficacy:    item.efcyQesitm     ?? null,
              usage_info:  item.useMethodQesitm ?? null,
              caution:     item.atpnQesitm     ?? null,
              side_effect: item.seQesitm       ?? null,
              image_url:   item.itemImage      ?? med.image_url ?? null,
            }

            const patch = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== null))

            if (Object.keys(patch).length > 0) {
              await supabase.from('medications').update(patch).eq('id', id)
              return NextResponse.json({
                medication: { ...med, ...patch },
                hasDetail: true,
                aiGenerated: false,
              })
            }
          }
        }
      } catch (err) {
        console.error('상세정보 조회 오류:', err instanceof Error ? err.message : err)
      }
    }
  }

  // 식약처에도 없으면 AI 요약 생성
  const aiSummary = await fetchAiSummary(med.item_name)
  if (aiSummary && (aiSummary.efficacy || aiSummary.side_effect)) {
    return NextResponse.json({
      medication: {
        ...med,
        efficacy:    aiSummary.efficacy    ?? med.efficacy,
        side_effect: aiSummary.side_effect ?? med.side_effect,
      },
      hasDetail: true,
      aiGenerated: true,
    })
  }

  return NextResponse.json({ medication: med, hasDetail: false, aiGenerated: false })
}
