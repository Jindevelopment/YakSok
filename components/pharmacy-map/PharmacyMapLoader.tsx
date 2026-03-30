'use client'

import dynamic from 'next/dynamic'
import Script from 'next/script'

const PharmacyMapClient = dynamic(
  () => import('./PharmacyMapClient'),
  { ssr: false, loading: () => <div className="flex-1 bg-sage-100 animate-pulse rounded-2xl min-h-64" /> }
)

export default function PharmacyMapLoader({ naverMapClientId }: { naverMapClientId: string }) {
  return (
    <>
      {naverMapClientId && (
        <Script
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverMapClientId}&submodules=geocoder`}
          strategy="afterInteractive"
        />
      )}
      <PharmacyMapClient />
    </>
  )
}
