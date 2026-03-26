'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string           // 'yyyy-MM-dd'
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const DAYS   = ['일','월','화','수','목','금','토']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ value, onChange, placeholder = '날짜 선택', className }: Props) {
  const today = new Date()

  const parsed = value ? new Date(value) : null
  const initYear  = parsed?.getFullYear()  ?? today.getFullYear()
  const initMonth = parsed?.getMonth()     ?? today.getMonth()

  const [open, setOpen]       = useState(false)
  const [viewYear, setYear]   = useState(initYear)
  const [viewMonth, setMonth] = useState(initMonth)
  const [showYearPicker, setShowYearPicker] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const yearListRef  = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowYearPicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 연도 목록 열릴 때 선택된 연도로 스크롤
  useEffect(() => {
    if (showYearPicker && yearListRef.current) {
      const el = yearListRef.current.querySelector('[data-selected="true"]') as HTMLElement
      el?.scrollIntoView({ block: 'center' })
    }
  }, [showYearPicker])

  // 마우스 휠로 월 빠르게 이동
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    // deltaY 크기로 한 번에 여러 달 건너뛰기 (빠른 스크롤)
    const step = e.deltaY > 0 ? 1 : -1
    setMonth(m => {
      let nm = m + step
      if (nm > 11) { setYear(y => y + 1); return 0 }
      if (nm < 0)  { setYear(y => y - 1); return 11 }
      return nm
    })
  }, [])

  const selectDate = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    onChange(`${viewYear}-${mm}-${dd}`)
    setOpen(false)
    setShowYearPicker(false)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const displayValue = parsed
    ? `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 ${parsed.getDate()}일`
    : ''

  const daysInMonth   = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfWeek = getFirstDayOfWeek(viewYear, viewMonth)
  const selectedDay   = parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth
    ? parsed.getDate() : null
  const todayDay      = today.getFullYear() === viewYear && today.getMonth() === viewMonth
    ? today.getDate() : null

  const yearRange = Array.from({ length: 100 }, (_, i) => today.getFullYear() - 99 + i).reverse()

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 입력 트리거 */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setShowYearPicker(false) }}
        className={cn(
          'input-base w-full flex items-center justify-between text-left',
          !displayValue && 'text-sage-400'
        )}
      >
        <span>{displayValue || placeholder}</span>
        <CalendarDays className="w-4 h-4 text-sage-400 shrink-0" />
      </button>

      {/* 달력 팝오버 */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-72 bg-white rounded-2xl shadow-lg border border-sage-100 overflow-hidden"
          onWheel={handleWheel}
        >
          {/* 연도 선택 패널 */}
          {showYearPicker ? (
            <div>
              <div className="px-4 py-3 border-b border-sage-100 flex items-center justify-between">
                <span className="font-semibold text-sage-800">연도 선택</span>
                <button
                  onClick={() => setShowYearPicker(false)}
                  className="text-xs text-mint-600 hover:text-mint-800 font-medium"
                >
                  닫기
                </button>
              </div>
              <div ref={yearListRef} className="h-52 overflow-y-auto">
                {yearRange.map(y => (
                  <button
                    key={y}
                    data-selected={y === viewYear}
                    onClick={() => { setYear(y); setShowYearPicker(false) }}
                    className={cn(
                      'w-full text-center py-2 text-sm transition-colors',
                      y === viewYear
                        ? 'bg-mint-50 text-mint-700 font-semibold'
                        : 'text-sage-700 hover:bg-sage-50'
                    )}
                  >
                    {y}년
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 월 헤더 */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-sage-100">
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-sage-50 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-sage-500" />
                </button>

                <button
                  onClick={() => setShowYearPicker(true)}
                  className="font-semibold text-sage-800 hover:text-mint-600 transition-colors text-sm px-2 py-1 rounded-lg hover:bg-sage-50"
                >
                  {viewYear}년 {MONTHS[viewMonth]}
                </button>

                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-sage-50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-sage-500" />
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                {DAYS.map((d, i) => (
                  <div key={d} className={cn(
                    'text-center text-xs font-medium py-1',
                    i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-sage-400'
                  )}>
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dow = (firstDayOfWeek + i) % 7
                  const isSelected = day === selectedDay
                  const isToday    = day === todayDay

                  return (
                    <button
                      key={day}
                      onClick={() => selectDate(day)}
                      className={cn(
                        'aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-mint-500 text-white shadow-sm'
                          : isToday
                          ? 'ring-2 ring-mint-400 text-mint-700'
                          : dow === 0
                          ? 'text-red-400 hover:bg-red-50'
                          : dow === 6
                          ? 'text-blue-400 hover:bg-blue-50'
                          : 'text-sage-700 hover:bg-sage-50'
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {/* 오늘 바로가기 */}
              <div className="border-t border-sage-100 px-3 py-2">
                <button
                  onClick={() => {
                    setYear(today.getFullYear())
                    setMonth(today.getMonth())
                    selectDate(today.getDate())
                  }}
                  className="w-full text-center text-xs text-mint-600 hover:text-mint-800 font-medium py-1 rounded-lg hover:bg-mint-50 transition-colors"
                >
                  오늘 선택
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
