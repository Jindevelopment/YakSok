export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, AlertCircle, Sparkles } from 'lucide-react'

interface AiSummary {
  efficacy?: string
  side_effect?: string
}

// DB에 효능·부작용 정보가 없을 때 Groq AI로 1줄 요약 생성
async function fetchAiSummary(itemName: string): Promise<AiSummary | null> {
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

    return JSON.parse(match[0]) as AiSummary
  } catch {
    return null
  }
}

export default async function MedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: med } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .single()

  if (!med) notFound()

  // 효능·부작용 둘 다 없을 때만 AI 요약 요청
  let aiSummary: AiSummary | null = null
  if (!med.efficacy && !med.side_effect) {
    aiSummary = await fetchAiSummary(med.item_name)
  }

  const sections = [
    {
      label: '효능·효과',
      content: med.efficacy ?? aiSummary?.efficacy ?? null,
      ai: !med.efficacy && !!aiSummary?.efficacy,
    },
    {
      label: '용법·용량',
      content: med.usage_info ?? null,
      ai: false,
    },
    {
      label: '주의사항',
      content: med.caution ?? null,
      ai: false,
    },
    {
      label: '부작용',
      content: med.side_effect ?? aiSummary?.side_effect ?? null,
      ai: !med.side_effect && !!aiSummary?.side_effect,
    },
    {
      label: '상호작용',
      content: med.interaction_info ?? null,
      ai: false,
    },
  ].filter(s => s.content)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/search" className="p-2 hover:bg-sage-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-sage-600" />
        </Link>
        <h1 className="text-xl font-bold text-sage-900 truncate">{med.item_name}</h1>
      </div>

      <div className="card flex items-start gap-4">
        <div className="w-20 h-20 bg-sage-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
          {med.image_url
            ? <img src={med.image_url} alt={med.item_name} className="w-full h-full object-cover" />
            : <span className="text-4xl">💊</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-sage-900">{med.item_name}</h2>
          {med.entp_name && <p className="text-sm text-sage-500 mt-0.5">{med.entp_name}</p>}
          {med.class_name && (
            <span className="inline-block mt-2 text-xs bg-sage-100 text-sage-600 px-2.5 py-1 rounded-full">
              {med.class_name}
            </span>
          )}
          <Link href={`/schedule/new?med=${med.id}`}
            className="btn-primary text-sm mt-3 inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> 복약 일정 등록
          </Link>
        </div>
      </div>

      {sections.map(({ label, content, ai }) => (
        <div key={label} className="card">
          <h3 className="font-semibold text-sage-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-mint-400 rounded-full inline-block" />
            {label}
            {ai && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                AI 요약
              </span>
            )}
          </h3>
          <p className="text-sm text-sage-600 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      ))}

      {aiSummary && (
        <div className="flex items-start gap-2 p-4 bg-violet-50 border border-violet-200 rounded-xl">
          <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
          <p className="text-xs text-violet-700 leading-relaxed">
            일부 정보는 AI가 생성한 요약입니다. 공식 데이터가 아니므로 참고용으로만 사용하세요.
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          본 정보는 식품의약품안전처 데이터를 기반으로 하며 참고용입니다.
          정확한 복약 지도는 의사 또는 약사와 상담하세요.
        </p>
      </div>
    </div>
  )
}
