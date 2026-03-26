import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `당신은 '약속' 서비스의 복약 상담 도우미입니다.

반드시 지켜야 할 규칙:
1. 반드시 한국어로만 답변합니다.
2. 의약품 정보, 복약 방법, 부작용, 주의사항에 대해서만 답변합니다.
3. 의료 진단, 처방, 질병 치료에 대한 조언은 제공하지 않습니다.
4. 모든 답변 끝에 "정확한 복약 지도는 의사 또는 약사와 상담하세요"를 명시합니다.
5. 답변은 명확하고 이해하기 쉽게 작성합니다.
6. 위험할 수 있는 정보(약물 과다복용 등)는 절대 제공하지 않습니다.`

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ reply: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { messages } = await request.json()
    if (!messages?.length) return NextResponse.json({ reply: '' }, { status: 400 })

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ reply: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const chatMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: m.content }))

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatMessages,
        ],
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Groq API 오류:', res.status, errText)
      return NextResponse.json(
        { reply: '답변 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      )
    }

    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content ?? '답변을 생성하지 못했습니다.'
    return NextResponse.json({ reply })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ reply: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 })
  }
}
