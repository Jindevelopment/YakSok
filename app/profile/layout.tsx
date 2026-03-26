import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const AppLayout = (await import('@/app/dashboard/layout')).default
  return <AppLayout>{children}</AppLayout>
}
