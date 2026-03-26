'use client'
import { useState, useTransition, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CheckCircle2, Circle, Sun, Sunset, Moon, Coffee } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Schedule, MedicationLog, TimeSlot } from '@/types'
import { cn } from '@/lib/utils'

const supabase = createClient()

const TIME_SLOTS: { slot: TimeSlot; label: string; icon: React.ElementType; color: string }[] = [
  { slot: 'morning',  label: '아침',   icon: Sun,     color: 'text-amber-500 bg-amber-50' },
  { slot: 'lunch',    label: '점심',   icon: Coffee,  color: 'text-orange-500 bg-orange-50' },
  { slot: 'dinner',   label: '저녁',   icon: Sunset,  color: 'text-purple-500 bg-purple-50' },
  { slot: 'bedtime',  label: '취침 전', icon: Moon,    color: 'text-blue-500 bg-blue-50' },
]

interface Props {
  schedules: (Schedule & { medication: { item_name: string; entp_name?: string } })[]
  logs: MedicationLog[]
  userName: string
  today: string
  userId: string
}

export default function DashboardClient({ schedules, logs: initialLogs, userName, today, userId }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [isPending, startTransition] = useTransition()

  const logMap = useMemo(() => {
    const map = new Map<string, MedicationLog>()
    for (const l of logs) {
      map.set(`${l.schedule_id}_${l.time_slot}`, l)
    }
    return map
  }, [logs])

  const isLogTaken = useCallback(
    (scheduleId: string, slot: TimeSlot) => {
      const log = logMap.get(`${scheduleId}_${slot}`)
      return log?.taken ?? false
    },
    [logMap]
  )

  const toggleLog = (scheduleId: string, medicationId: string, slot: TimeSlot) => {
    startTransition(async () => {
      const existing = logMap.get(`${scheduleId}_${slot}`)
      if (existing) {
        const newTaken = !existing.taken
        const { error } = await supabase
          .from('medication_logs')
          .update({ taken: newTaken, taken_at: newTaken ? new Date().toISOString() : null })
          .eq('id', existing.id)
        if (error) {
          toast.error('복약 상태 변경에 실패했습니다.')
        } else {
          setLogs(prev => prev.map(l => l.id === existing.id ? { ...l, taken: newTaken } : l))
          toast.success(newTaken ? '복약 완료!' : '복약 취소')
        }
      } else {
        const { data, error } = await supabase
          .from('medication_logs')
          .insert({ user_id: userId, schedule_id: scheduleId, medication_id: medicationId,
            log_date: today, time_slot: slot, taken: true, taken_at: new Date().toISOString() })
          .select().single()
        if (error) {
          toast.error('복약 기록에 실패했습니다.')
        } else if (data) {
          setLogs(prev => [...prev, data])
          toast.success('복약 완료!')
        }
      }
    })
  }

  const totalDoses = schedules.reduce((sum, s) => sum + s.time_slots.length, 0)
  const takenDoses = logs.filter(l => l.taken).length
  const rate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0

  const dateLabel = format(new Date(), 'M월 d일 EEEE', { locale: ko })

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* 헤더 */}
      <div>
        <p className="text-sm text-sage-500">{dateLabel}</p>
        <h1 className="text-2xl font-bold text-sage-900">
          {userName ? `${userName}님, ` : ''}안녕하세요 👋
        </h1>
      </div>

      {/* 완료율 카드 */}
      <div className="card bg-gradient-to-r from-mint-500 to-mint-400 text-white border-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-mint-100 text-sm">오늘의 복약 완료율</p>
            <p className="text-4xl font-bold">{rate}%</p>
            <p className="text-mint-100 text-sm mt-1">{takenDoses} / {totalDoses} 회 완료</p>
          </div>
          <div className="w-20 h-20 relative" role="img" aria-label={`복약 완료율 ${rate}%`}>
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="white" strokeWidth="3"
                strokeDasharray={`${rate} ${100 - rate}`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" aria-hidden="true">{rate}%</span>
          </div>
        </div>
        {rate === 100 && (
          <div className="bg-white/20 rounded-xl px-3 py-2 text-sm">
            🎉 오늘 모든 약을 복용했습니다!
          </div>
        )}
      </div>

      {/* 시간대별 복약 목록 */}
      {schedules.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3" role="img" aria-label="약">💊</p>
          <p className="text-sage-500 font-medium mb-1">오늘 복용할 약이 없습니다</p>
          <p className="text-sage-400 text-sm">복약 일정 메뉴에서 약을 추가해 주세요</p>
        </div>
      ) : (
        TIME_SLOTS.map(({ slot, label, icon: Icon, color }) => {
          const slotSchedules = schedules.filter(s => s.time_slots.includes(slot))
          if (slotSchedules.length === 0) return null
          const allTaken = slotSchedules.every(s => isLogTaken(s.id, slot))

          return (
            <div key={slot} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sage-800">{label}</span>
                  <span className="text-sm text-sage-400">{slotSchedules.length}개</span>
                </div>
                {allTaken && <span className="badge-taken">✓ 완료</span>}
              </div>

              <div className="space-y-3">
                {slotSchedules.map(s => {
                  const taken = isLogTaken(s.id, slot)
                  return (
                    <button key={s.id}
                      onClick={() => toggleLog(s.id, s.medication_id, slot)}
                      disabled={isPending}
                      aria-label={`${s.medication?.item_name} ${taken ? '복약 완료 — 취소하려면 탭하세요' : '복약하기'}`}
                      aria-pressed={taken}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                        taken
                          ? 'border-mint-200 bg-mint-50'
                          : 'border-sage-100 bg-white hover:border-sage-200 hover:bg-sage-50'
                      )}>
                      {taken
                        ? <CheckCircle2 className="w-6 h-6 text-mint-500 shrink-0" aria-hidden="true" />
                        : <Circle className="w-6 h-6 text-sage-300 shrink-0" aria-hidden="true" />}
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium text-sm truncate', taken ? 'text-mint-700 line-through' : 'text-sage-800')}>
                          {s.medication?.item_name}
                        </p>
                        {s.dosage && <p className="text-xs text-sage-400 mt-0.5">{s.dosage}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
