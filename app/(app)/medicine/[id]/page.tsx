export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react'

export default async function MedicinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: med } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .single()

  if (!med) notFound()

  const sections = [
    { label: '효능·효과',  content: med.efficacy },
    { label: '용법·용량',  content: med.usage_info },
    { label: '주의사항',   content: med.caution },
    { label: '부작용',     content: med.side_effect },
    { label: '상호작용',   content: med.interaction_info },
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

      {sections.map(({ label, content }) => (
        <div key={label} className="card">
          <h3 className="font-semibold text-sage-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-mint-400 rounded-full inline-block" />
            {label}
          </h3>
          <p className="text-sm text-sage-600 leading-relaxed whitespace-pre-line">{content}</p>
        </div>
      ))}

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
