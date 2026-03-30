export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const now = new Date()
  const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const today = kstDate.toISOString().split('T')[0]

  const [
    { data: schedules },
    { data: logs },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from('schedules')
      .select(`id,user_id,medication_id,start_date,end_date,time_slots,dosage,is_active,created_at,medication:medications(id,item_name,entp_name)`)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`),

    supabase
      .from('medication_logs')
      .select('id,user_id,schedule_id,medication_id,log_date,time_slot,taken,taken_at')
      .eq('user_id', user.id)
      .eq('log_date', today),

    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedSchedules = (schedules ?? []) as any

  return (
    <DashboardClient
      schedules={typedSchedules}
      logs={logs ?? []}
      userName={profile?.name ?? ''}
      today={today}
      userId={user.id}
    />
  )
}
