'use client'
import { ShieldCheck, ShieldAlert, AlertTriangle, XCircle } from 'lucide-react'
import type { Medication, DrugInteraction, Severity } from '@/types'
import clsx from 'clsx'

const SEVERITY_CONFIG: Record<Severity, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  low:              { label: '낮음',    icon: AlertTriangle,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  medium:           { label: '보통',    icon: AlertTriangle,  color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  high:             { label: '높음',    icon: ShieldAlert,    color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  contraindicated:  { label: '병용금기', icon: XCircle,        color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
}

export default function InteractionClient({ medications, interactions }: {
  medications: Medication[]
  interactions: DrugInteraction[]
}) {
  const hasWarning = interactions.length > 0
  const highRisk = interactions.filter(i => i.severity === 'contraindicated' || i.severity === 'high')

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sage-900">약물 상호작용</h1>
        <p className="text-sm text-sage-500 mt-1">현재 복용 중인 약의 위험 조합을 확인합니다</p>
      </div>

      {/* 현재 복용 약 목록 */}
      <div className="card">
        <h2 className="font-semibold text-sage-800 mb-3">복용 중인 약 ({medications.length}개)</h2>
        {medications.length === 0 ? (
          <p className="text-sage-400 text-sm">등록된 복약 일정이 없습니다</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {medications.map(m => (
              <span key={m.id} className="inline-flex items-center gap-1.5 bg-sage-100 text-sage-700 text-sm px-3 py-1.5 rounded-full">
                💊 {m.item_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 분석 결과 */}
      {medications.length < 2 ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <ShieldCheck className="w-12 h-12 text-sage-300 mb-3" />
          <p className="text-sage-500 font-medium">2개 이상의 약이 등록되어야</p>
          <p className="text-sage-500">상호작용을 확인할 수 있습니다</p>
        </div>
      ) : !hasWarning ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <ShieldCheck className="w-14 h-14 text-mint-500 mb-3" />
          <p className="text-mint-700 text-lg font-semibold">안전한 조합입니다</p>
          <p className="text-sage-500 text-sm mt-1">위험한 약물 상호작용이 발견되지 않았습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {highRisk.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                {highRisk.length}개의 위험한 조합이 발견되었습니다. 즉시 의사·약사와 상담하세요.
              </p>
            </div>
          )}

          {interactions.map(i => {
            const cfg = SEVERITY_CONFIG[i.severity as Severity]
            const Icon = cfg.icon
            return (
              <div key={i.id} className={clsx('p-4 rounded-xl border', cfg.bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={clsx('w-5 h-5 shrink-0', cfg.color)} />
                  <span className={clsx('text-sm font-semibold', cfg.color)}>
                    위험도: {cfg.label}
                  </span>
                </div>
                <p className="font-medium text-sage-800 text-sm">
                  {i.medication_a?.item_name} ↔ {i.medication_b?.item_name}
                </p>
                {i.description && (
                  <p className="text-xs text-sage-600 mt-1 leading-relaxed">{i.description}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="text-xs text-sage-400 text-center leading-relaxed">
        ⚠️ 본 정보는 참고용이며 의료 진단을 대체하지 않습니다.<br />
        반드시 의사 또는 약사와 상담 후 복용 여부를 결정하세요.
      </div>
    </div>
  )
}
