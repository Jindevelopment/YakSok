import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BASE64_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) return NextResponse.json({ candidates: [] }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ candidates: [], error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const [, base64Data] = image.split(',')
    if (base64Data && Buffer.byteLength(base64Data, 'base64') > MAX_BASE64_BYTES) {
      return NextResponse.json(
        { candidates: [], error: '이미지 크기는 5MB를 초과할 수 없습니다.' },
        { status: 413 }
      )
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: image },
              },
              {
                type: 'text',
                text: `이 이미지에서 의약품 이름을 찾아주세요.
약 포장지, 약병, 약 설명서 등에서 약품명만 추출합니다.
결과는 JSON 배열 형식으로만 답변하세요. 예: ["타이레놀", "아스피린"]
약품명이 없으면 빈 배열 []을 반환하세요.
JSON 외의 다른 텍스트는 절대 포함하지 마세요.`,
              },
            ],
          },
        ],
        max_tokens: 256,
        temperature: 0,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Groq Vision 오류:', err)
      return NextResponse.json({ candidates: [], error: '이미지 분석에 실패했습니다.' }, { status: 500 })
    }

    const data = await res.json()
    const rawText = data?.choices?.[0]?.message?.content?.trim() ?? '[]'

    let medicationNames: string[] = []
    try {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim()
      medicationNames = JSON.parse(cleaned)
      if (!Array.isArray(medicationNames)) medicationNames = []
    } catch {
      medicationNames = rawText
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length >= 2)
        .slice(0, 3)
    }

    if (medicationNames.length === 0) {
      return NextResponse.json({ candidates: [] })
    }

    const supabase = createClient()
    const results = await Promise.all(
      medicationNames
        .filter((name: string) => name.length >= 2)
        .map(async (name: string) => {
          const { data: dbMed } = await supabase
            .from('medications')
            .select('*')
            .ilike('item_name', `%${name}%`)
            .limit(1)
            .single()

          if (dbMed) return dbMed
          return {
            id: crypto.randomUUID(),
            item_name: name,
            entp_name: null,
            efficacy: null,
            image_url: null,
          }
        })
    )

    return NextResponse.json({ candidates: results.filter(Boolean) })

  } catch (error) {
    console.error('Image search error:', error)
    return NextResponse.json({ candidates: [], error: '분석 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
