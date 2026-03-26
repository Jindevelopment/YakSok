'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Trash2, ToggleLeft, ToggleRight, Sun, Coffee, Sunset, Moon, X, Check } from 'lucide-react'
import type { Schedule, TimeSlot } from '@/types'
import clsx from 'clsx'

const SLOT_LABELS: Record<TimeSlot, { label: string; icon: React.ElementType }> = {
  morning: { label: '아침', icon: Sun },
  lunch:   { label: '점심', icon: Coffee },
  dinner:  { label: '저녁', icon: Sunset },
  bedtime: { label: '취침 전', icon: Moon },
}

export default function ScheduleList({ schedules: initial }: {
  schedules: (Schedule & { medication: any })[]
}) {
  const supabase = createClient()
  const [schedules, setSchedules] = useState(initial)
  // UX-05: window.confirm() 대신 인라인 확인 UI 상태 관리
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('schedules').update({ is_active: !current }).eq('id', id)
    if (!error) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
      toast.success(current ? '일정을 중단했습니다' : '일정을 재개했습니다')
    } else {
      toast.error('일정 변경에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  const confirmDelete = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (!error) {
      setSchedules(prev => prev.filter(s => s.id !== id))
      toast.success('복약 일정을 삭제했습니다')
    } else {
      toast.error('삭제에 실패했습니다. 다시 시도해 주세요.')
    }
    setPendingDeleteId(null)
  }

  if (schedules.length === 0) {
    return (
      <div className="card text-center py-14">
        <p className="text-4xl mb-3" role="img" aria-label="약">💊</p>
        <p className="text-sage-500 font-medium">등록된 복약 일정이 없습니다</p>
        <p className="text-sm text-sage-400 mt-1">약 추가 버튼을 눌러 시작하세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {schedules.map(s => (
        <div key={s.id} className={clsx('card transition-opacity', !s.is_active && 'opacity-60')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 bg-sage-100 rounded-xl flex items-center justify-center shrink-0"
                aria-hidden="true">
                <span className="text-xl">💊</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sage-900 truncate">{s.medication?.item_name}</p>
                <p className="text-xs text-sage-500 mt-0.5">{s.medication?.entp_name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.time_slots.map((slot: TimeSlot) => {
                    const { label, icon: Icon } = SLOT_LABELS[slot]
                    return (
                      <span key={slot} className="inline-flex items-center gap-1 text-xs bg-mint-50 text-mint-700 px-2 py-0.5 rounded-full">
                        <Icon className="w-3 h-3" aria-hidden="true" />{label}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs text-sage-400 mt-1">
                  {s.start_date} {s.end_date ? `~ ${s.end_date}` : '~ 계속'}
                  {s.dosage && ` · ${s.dosage}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* 일정 활성/비활성 토글 */}
              <button
                onClick={() => toggleActive(s.id, s.is_active)}
                aria-label={s.is_active ? '일정 중단' : '일정 재개'}
                className="p-2 rounded-lg hover:bg-sage-50 text-sage-400 hover:text-sage-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                {s.is_active
                  ? <ToggleRight className="w-5 h-5 text-mint-500" aria-hidden="true" />
                  : <ToggleLeft className="w-5 h-5" aria-hidden="true" />}
              </button>

              {/* UX-05: 인라인 삭제 확인 UI */}
              {pendingDeleteId === s.id ? (
                <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-xl px-2 py-1">
                  <span className="text-xs text-red-600 font-medium whitespace-nowrap">삭제할까요?</span>
                  <button
                    onClick={() => confirmDelete(s.id)}
                    aria-label="삭제 확인"
                    className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    aria-label="삭제 취소"
                    className="p-1.5 rounded-lg text-sage-500 hover:bg-sage-100 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center">
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPendingDeleteId(s.id)}
                  aria-label="복약 일정 삭제"
                  className="p-2 rounded-lg hover:bg-red-50 text-sage-400 hover:text-red-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
