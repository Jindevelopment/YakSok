export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from '@/components/dashboard/CalendarClient'
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const rawMonth = month ?? ''

  const MONTH_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])$/
  const isValidMonth = MONTH_REGEX.test(rawMonth) && isValid(new Date(rawMonth + '-01'))
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const monthStr = isValidMonth ? rawMonth : kstNow.toISOString().slice(0, 7)

  const monthDate = new Date(monthStr + '-01')
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end   = format(endOfMonth(monthDate),   'yyyy-MM-dd')

  const { data: logs } = await supabase
    .from('medication_logs')
    .select('log_date, taken, time_slot, medication:medications(item_name)')
    .eq('user_id', user.id)
    .gte('log_date', start)
    .lte('log_date', end)

  const dateMap: Record<string, {
    total: number
    taken: number
    logs: { time_slot: string; taken: boolean; item_name: string }[]
  }> = {}

  for (const log of logs ?? []) {
    if (!dateMap[log.log_date]) dateMap[log.log_date] = { total: 0, taken: 0, logs: [] }
    dateMap[log.log_date].total++
    if (log.taken) dateMap[log.log_date].taken++
    dateMap[log.log_date].logs.push({
      time_slot: log.time_slot,
      taken: log.taken,
      item_name: (log.medication as any)?.item_name ?? '알 수 없음',
    })
  }

  return <CalendarClient dateMap={dateMap} currentMonth={monthStr} />
}
