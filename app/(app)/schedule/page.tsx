export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ScheduleList from '@/components/schedule/ScheduleList'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: schedules } = await supabase
    .from('schedules')
    .select(`id,user_id,medication_id,start_date,end_date,time_slots,dosage,memo,is_active,created_at,medication:medications(id,item_name,entp_name,image_url)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-900">복약 일정</h1>
          <p className="text-sm text-sage-500 mt-1">복용 중인 약을 관리하세요</p>
        </div>
        <Link href="/schedule/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 약 추가
        </Link>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ScheduleList schedules={(schedules ?? []) as any} />
    </div>
  )
}
