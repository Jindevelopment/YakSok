import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PharmacyMapClient from '@/components/pharmacy-map/PharmacyMapClient'

export const metadata = { title: '근처 약국 찾기 | 약속' }

export default async function PharmacyMapPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="flex flex-col h-full">
      <PharmacyMapClient />
    </div>
  )
}
