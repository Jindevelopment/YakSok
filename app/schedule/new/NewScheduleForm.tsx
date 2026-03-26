'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Sun, Coffee, Moon, Bed, Check } from 'lucide-react'
import DatePicker from '@/components/ui/DatePicker'
import type { TimeSlot, Medication } from '@/types'
import Link from 'next/link'

const TIME_SLOTS: { value: TimeSlot; label: string; icon: React.ReactNode; sub: string }[] = [
  { value: 'morning',  label: '아침',    icon: <Sun  className="w-4 h-4" />, sub: '기상 후' },
  { value: 'lunch',    label: '점심',    icon: <Coffee className="w-4 h-4" />, sub: '식사 후' },
  { value: 'dinner',   label: '저녁',    icon: <Moon className="w-4 h-4" />, sub: '식사 후' },
  { value: 'bedtime',  label: '취침 전', icon: <Bed  className="w-4 h-4" />, sub: '자기 전' },
]

export default function NewScheduleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const medId = searchParams.get('med')

  const [medication, setMedication] = useState<Medication | null>(null)
  const [loadingMed, setLoadingMed] = useState(!!medId)

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(['morning'])
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>('')
  const [useEndDate, setUseEndDate] = useState(false)
  const [dosage, setDosage] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!medId) return
    const supabase = createClient()
    supabase
      .from('medications')
      .select('*')
      .eq('id', medId)
      .single()
      .then(({ data }) => {
        if (data) setMedication(data)
        setLoadingMed(false)
      })
  }, [medId])

  const toggleSlot = (slot: TimeSlot) => {
    setTimeSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medication) {
      toast.error('약을 선택해주세요')
      return
    }
    if (timeSlots.length === 0) {
      toast.error('복용 시간대를 하나 이상 선택해주세요')
      return
    }
    if (useEndDate && endDate && endDate < startDate) {
      toast.error('종료일은 시작일 이후여야 합니다')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인이 필요합니다'); setSaving(false); return }

    const { error } = await supabase.from('schedules').insert({
      user_id: user.id,
      medication_id: medication.id,
      time_slots: timeSlots,
      start_date: startDate,
      end_date: useEndDate && endDate ? endDate : null,
      dosage: dosage.trim() || null,
      memo: memo.trim() || null,
      is_active: true,
    })

    if (error) {
      toast.error('저장에 실패했습니다: ' + error.message)
      setSaving(false)
      return
    }

    toast.success('복약 일정이 등록됐습니다!')
    router.push('/schedule')
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/schedule" className="p-2 rounded-xl hover:bg-sage-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-sage-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-sage-900">약 추가</h1>
          <p className="text-sm text-sage-500 mt-0.5">복약 일정을 등록하세요</p>
        </div>
      </div>

      {/* 선택된 약 */}
      <div className="card">
        <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">선택된 약</p>
        {loadingMed ? (
          <div className="flex items-center gap-2 text-sage-400">
            <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
          </div>
        ) : medication ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sage-100 flex items-center justify-center shrink-0 overflow-hidden">
              {medication.image_url
                ? <img src={medication.image_url} alt={medication.item_name} className="w-full h-full object-cover" />
                : <span className="text-2xl">💊</span>}
            </div>
            <div>
              <p className="font-semibold text-sage-900">{medication.item_name}</p>
              {medication.entp_name && <p className="text-xs text-sage-500">{medication.entp_name}</p>}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sage-400 text-sm">약이 선택되지 않았습니다</p>
            <Link href="/search" className="text-mint-600 text-sm font-medium hover:underline mt-1 inline-block">
              약 검색하러 가기 →
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 복용 시간대 */}
        <div className="card">
          <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">복용 시간대 <span className="text-red-400">*</span></p>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map(({ value, label, icon, sub }) => {
              const selected = timeSlots.includes(value)
              return (
                <button key={value} type="button" onClick={() => toggleSlot(value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    selected
                      ? 'border-mint-400 bg-mint-50 text-mint-700'
                      : 'border-sage-100 bg-white text-sage-600 hover:border-sage-200'
                  }`}>
                  <span className={selected ? 'text-mint-600' : 'text-sage-400'}>{icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs opacity-60">{sub}</p>
                  </div>
                  {selected && <Check className="w-4 h-4 text-mint-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* 복용량 */}
        <div className="card">
          <label className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3 block">
            복용량 (선택)
          </label>
          <input
            type="text"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            placeholder="예: 1정, 5mL"
            className="input-base w-full"
          />
        </div>

        {/* 복용 기간 */}
        <div className="card space-y-4">
          <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide">복용 기간</p>
          <div>
            <label className="text-sm text-sage-700 font-medium mb-2 block">시작일 <span className="text-red-400">*</span></label>
            <DatePicker value={startDate} onChange={v => setStartDate(v)} />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <div
                onClick={() => setUseEndDate(v => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative ${useEndDate ? 'bg-mint-500' : 'bg-sage-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${useEndDate ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-sage-700 font-medium">종료일 설정</span>
            </label>
            {useEndDate && (
              <DatePicker
                value={endDate || startDate}
                onChange={v => setEndDate(v)}
              />
            )}
          </div>
        </div>

        {/* 메모 */}
        <div className="card">
          <label className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3 block">
            메모 (선택)
          </label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="복용 관련 메모를 입력하세요"
            rows={3}
            className="input-base w-full resize-none"
          />
        </div>

        {/* 저장 버튼 */}
        <button type="submit" disabled={saving || !medication || timeSlots.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? '저장 중...' : '복약 일정 등록'}
        </button>
      </form>
    </div>
  )
}
