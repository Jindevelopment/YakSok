'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import type { Medication } from '@/types'

interface Props {
  medication: Medication
  showAddButton?: boolean
}

function ShapeBadge({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-sage-50 text-sage-600 px-2 py-0.5 rounded-full border border-sage-200">
      <span className="text-sage-400">{label}</span> {value}
    </span>
  )
}

export default function MedicationCard({ medication: initialMed, showAddButton }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [medication, setMedication] = useState<Medication>(initialMed)
  const [detailState, setDetailState] = useState<'idle' | 'loading' | 'done' | 'none'>('idle')
  const [aiGenerated, setAiGenerated] = useState(false)

  const hasShapeInfo =
    medication.drug_shape || medication.color_class1 || medication.form_code_name ||
    medication.print_front || medication.print_back || medication.mark_code_front || medication.mark_code_back

  const handleExpand = async () => {
    const next = !expanded
    setExpanded(next)

    if (next && detailState === 'idle' && !medication.usage_info) {
      setDetailState('loading')
      try {
        const res = await fetch(`/api/medications/detail?id=${medication.id}`)
        const data = await res.json()
        if (data.medication) setMedication(data.medication)
        setAiGenerated(data.aiGenerated ?? false)
        setDetailState(data.hasDetail ? 'done' : 'none')
      } catch {
        setDetailState('none')
      }
    }
  }

  const markText = [medication.print_front, medication.print_back, medication.mark_code_front, medication.mark_code_back]
    .filter(Boolean).join(' / ')

  const colorText = [medication.color_class1, medication.color_class2].filter(Boolean).join(' + ')

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-sage-100 flex items-center justify-center shrink-0 overflow-hidden">
          {medication.image_url ? (
            <img src={medication.image_url} alt={medication.item_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">💊</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sage-900 truncate">{medication.item_name}</h3>
              {medication.entp_name && (
                <p className="text-xs text-sage-500 mt-0.5">{medication.entp_name}</p>
              )}
              {medication.class_name && (
                <span className="inline-block mt-1 text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full">
                  {medication.class_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showAddButton && (
                <Link href={`/schedule/new?med=${medication.id}`}
                  className="p-1.5 bg-mint-50 text-mint-600 rounded-lg hover:bg-mint-100 transition-colors">
                  <Plus className="w-4 h-4" />
                </Link>
              )}
              <button onClick={handleExpand}
                className="p-1.5 text-sage-400 hover:text-sage-600 rounded-lg hover:bg-sage-50 transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {hasShapeInfo && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <ShapeBadge label="모양" value={medication.drug_shape} />
              <ShapeBadge label="색상" value={colorText || undefined} />
              <ShapeBadge label="제형" value={medication.form_code_name} />
              {markText && <ShapeBadge label="각인" value={markText} />}
            </div>
          )}

          {!expanded && medication.efficacy && (
            <p className="text-xs text-sage-500 mt-2 line-clamp-2 leading-relaxed">
              {medication.efficacy}
            </p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-sage-100 space-y-3">
          {detailState === 'loading' && (
            <div className="flex items-center gap-2 py-3 text-sage-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">상세 정보를 불러오는 중...</span>
            </div>
          )}

          {detailState === 'none' && !medication.efficacy && (
            <p className="text-xs text-sage-400 py-2">이 약품의 상세 정보는 제공되지 않습니다.</p>
          )}

          {aiGenerated && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-lg">
              <Sparkles className="w-3 h-3 text-violet-500 shrink-0" />
              <p className="text-xs text-violet-600">AI가 생성한 요약 정보입니다. 참고용으로만 사용하세요.</p>
            </div>
          )}

          {[
            { label: '효능·효과', content: medication.efficacy, ai: aiGenerated },
            { label: '용법·용량', content: medication.usage_info, ai: false },
            { label: '주의사항', content: medication.caution, ai: false },
            { label: '부작용', content: medication.side_effect, ai: aiGenerated },
            { label: '상호작용', content: medication.interaction_info, ai: false },
          ].filter(i => i.content).map(({ label, content, ai }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-sage-700 mb-1 flex items-center gap-1.5">
                {label}
                {ai && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-violet-600 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI 요약
                  </span>
                )}
              </p>
              <p className="text-xs text-sage-600 leading-relaxed whitespace-pre-line">{content}</p>
            </div>
          ))}

          {medication.chart && (
            <div>
              <p className="text-xs font-semibold text-sage-700 mb-1">성상</p>
              <p className="text-xs text-sage-600 leading-relaxed">{medication.chart}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-sage-400">⚠️ 참고용 정보이며 의료 진단을 대체하지 않습니다</p>
            {showAddButton && (
              <Link href={`/schedule/new?med=${medication.id}`}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <Plus className="w-3 h-3" /> 일정 등록
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
