import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PharmacyMapLoader from '@/components/pharmacy-map/PharmacyMapLoader'

export const metadata = { title: '근처 약국 찾기 | 약속' }

export default async function PharmacyMapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const naverMapClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''

  return (
    <div className="flex flex-col h-full">
      <PharmacyMapLoader naverMapClientId={naverMapClientId} />
    </div>
  )
}
