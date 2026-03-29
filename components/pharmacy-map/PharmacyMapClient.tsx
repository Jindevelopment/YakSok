'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation, RefreshCw, AlertCircle, Phone, Search } from 'lucide-react'

interface Pharmacy {
  name: string
  address: string
  roadAddress: string
  telephone: string
  lat: number
  lng: number
}

declare global {
  interface Window {
    naver: any
  }
}

const FALLBACK_LAT = 37.5665
const FALLBACK_LNG = 126.9780

export default function PharmacyMapClient() {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<{ marker: any; pharmacy: Pharmacy }[]>([])
  const infoWindowRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)

  const searchMarkerRef = useRef<any>(null)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [geocodeError, setGeocodeError] = useState<string | null>(null)

  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(({ marker }) => marker.setMap(null))
    markersRef.current = []
    infoWindowRef.current?.close()
    infoWindowRef.current = null
    setSelectedIdx(null)
  }, [])

  const openInfoWindow = useCallback((marker: any, pharmacy: Pharmacy, idx: number) => {
    if (!mapRef.current || !window.naver?.maps) return
    infoWindowRef.current?.close()

    infoWindowRef.current = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding:12px 14px;max-width:230px;font-family:'Pretendard',sans-serif;line-height:1.4">
          <p style="margin:0;font-size:13px;font-weight:700;color:#145436">${pharmacy.name}</p>
          ${pharmacy.telephone ? `<p style="margin:6px 0 0;font-size:12px;color:#576e5a">📞 ${pharmacy.telephone}</p>` : ''}
          <p style="margin:4px 0 0;font-size:11px;color:#8a9a8c">${pharmacy.roadAddress || pharmacy.address || ''}</p>
        </div>
      `,
      borderWidth: 0,
      disableAnchor: false,
      backgroundColor: 'white',
      borderColor: 'transparent',
    })
    infoWindowRef.current.open(mapRef.current, marker)
    setSelectedIdx(idx)
  }, [])

  const addPharmacyMarkers = useCallback((items: Pharmacy[]) => {
    if (!mapRef.current || !window.naver?.maps) return
    clearMarkers()

    items.forEach((pharmacy, idx) => {
      const position = new window.naver.maps.LatLng(pharmacy.lat, pharmacy.lng)
      const marker = new window.naver.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          content: `<div style="background:#22c77a;color:white;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.25);white-space:nowrap;">${pharmacy.name}</div>`,
          anchor: new window.naver.maps.Point(21, 12),
        },
        title: pharmacy.name,
        zIndex: 100,
      })

      window.naver.maps.Event.addListener(marker, 'click', () => {
        openInfoWindow(marker, pharmacy, idx)
      })

      markersRef.current.push({ marker, pharmacy })
    })
  }, [clearMarkers, openInfoWindow])

  const searchPharmacies = useCallback(async (lat: number, lng: number) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/pharmacy/search?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      const items: Pharmacy[] = data.items ?? []
      setPharmacies(items)
      addPharmacyMarkers(items)
    } catch {
      setPharmacies([])
    } finally {
      setSearching(false)
    }
  }, [addPharmacyMarkers])

  const initMap = useCallback((lat: number, lng: number) => {
    if (!mapDivRef.current || mapRef.current) return

    const center = new window.naver.maps.LatLng(lat, lng)
    mapRef.current = new window.naver.maps.Map(mapDivRef.current, {
      center,
      zoom: 15,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: true,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    })

    userMarkerRef.current = new window.naver.maps.Marker({
      position: center,
      map: mapRef.current,
      icon: {
        content: `<div style="width:14px;height:14px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.25)"></div>`,
        anchor: new window.naver.maps.Point(7, 7),
      },
      zIndex: 200,
    })

    setMapReady(true)
  }, [])

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setUserCoords({ lat: FALLBACK_LAT, lng: FALLBACK_LNG })
      setLocationError('위치 정보를 지원하지 않는 브라우저입니다. 서울 시청을 기준으로 표시합니다.')
      initMap(FALLBACK_LAT, FALLBACK_LNG)
      searchPharmacies(FALLBACK_LAT, FALLBACK_LNG)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setUserCoords({ lat, lng })
        initMap(lat, lng)
        searchPharmacies(lat, lng)
      },
      () => {
        setUserCoords({ lat: FALLBACK_LAT, lng: FALLBACK_LNG })
        setLocationError('위치 권한이 거부되었습니다. 서울 시청을 기준으로 표시합니다.')
        initMap(FALLBACK_LAT, FALLBACK_LNG)
        searchPharmacies(FALLBACK_LAT, FALLBACK_LNG)
      },
      { timeout: 10_000, maximumAge: 60_000 }
    )
  }, [initMap, searchPharmacies])

  // 네이버 지도 스크립트 로드
  useEffect(() => {
    if (!clientId) return

    if (window.naver?.maps) {
      getUserLocation()
      return
    }

    const script = document.createElement('script')
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`
    script.async = true
    script.onload = () => getUserLocation()
    script.onerror = () => {
      setMapError('네이버 지도 스크립트를 불러오지 못했습니다. API 키를 확인해주세요.')
    }
    document.head.appendChild(script)
  }, [clientId, getUserLocation])

  const handleGoToMyLocation = () => {
    if (!mapRef.current || !userCoords || !window.naver?.maps) return
    mapRef.current.panTo(new window.naver.maps.LatLng(userCoords.lat, userCoords.lng))
  }

  const handleRefresh = () => {
    if (!mapRef.current) return
    const center = mapRef.current.getCenter()
    searchPharmacies(center.lat(), center.lng())
  }

  const handleLocationSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim() || !mapRef.current || !window.naver?.maps) return
    setGeocodeError(null)
    setSearching(true)

    try {
      const res = await fetch(`/api/geocode?query=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()

      if (!data.addresses?.length) {
        setGeocodeError('검색 결과가 없습니다. 더 자세한 주소를 입력해 보세요.')
        return
      }

      const { x, y } = data.addresses[0]
      const lat = parseFloat(y)
      const lng = parseFloat(x)
      const position = new window.naver.maps.LatLng(lat, lng)

      searchMarkerRef.current?.setMap(null)
      searchMarkerRef.current = new window.naver.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          content: `<div style="width:14px;height:14px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(239,68,68,0.25)"></div>`,
          anchor: new window.naver.maps.Point(7, 7),
        },
        zIndex: 200,
      })

      mapRef.current.panTo(position)
      searchPharmacies(lat, lng)
    } catch {
      setGeocodeError('주소 검색 중 오류가 발생했습니다.')
    } finally {
      setSearching(false)
    }
  }, [searchQuery, searchPharmacies])

  const handleListClick = (idx: number) => {
    const entry = markersRef.current[idx]
    if (!entry || !mapRef.current) return
    mapRef.current.panTo(entry.marker.getPosition())
    openInfoWindow(entry.marker, entry.pharmacy, idx)
  }

  if (!clientId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center gap-3">
        <AlertCircle className="w-12 h-12 text-amber-400" />
        <div>
          <p className="font-semibold text-sage-900">네이버 지도 API 키가 설정되지 않았습니다</p>
          <p className="text-sm text-sage-500 mt-1">
            <code className="bg-sage-100 px-1 rounded text-xs">NEXT_PUBLIC_NAVER_MAP_CLIENT_ID</code>를{' '}
            <code className="bg-sage-100 px-1 rounded text-xs">.env.local</code>에 추가해주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-sage-900">근처 약국 찾기</h1>
          <p className="text-sm text-sage-500 mt-0.5">현재 위치 기준 가까운 약국을 지도에서 확인하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGoToMyLocation}
            disabled={!mapReady}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-sage-200 text-sage-600 hover:bg-sage-50 disabled:opacity-40 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">내 위치</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={searching || !mapReady}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${searching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{searching ? '검색 중' : '새로고침'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleLocationSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setGeocodeError(null) }}
          placeholder="주소 또는 지역 검색 (예: 강남구 역삼동)"
          disabled={!mapReady}
          className="flex-1 px-4 py-2.5 rounded-xl border border-sage-200 text-sm focus:outline-none focus:ring-2 focus:ring-mint-400 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!mapReady || !searchQuery.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-mint-500 text-white hover:bg-mint-600 disabled:opacity-40 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">검색</span>
        </button>
      </form>

      {geocodeError && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {geocodeError}
        </div>
      )}

      {locationError && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {locationError}
        </div>
      )}

      {mapError && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {mapError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        <div className="relative flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-sage-200">
          {!mapReady && !mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-sage-50 z-10 gap-2">
              <div className="w-8 h-8 border-[3px] border-mint-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-sage-500">지도를 불러오는 중...</p>
            </div>
          )}
          <div ref={mapDivRef} className="w-full h-full" />
        </div>

        <div className="lg:w-72 flex flex-col gap-2 min-h-0">
          <p className="text-sm font-medium text-sage-600 shrink-0">
            {searching
              ? '약국 검색 중...'
              : pharmacies.length > 0
              ? `약국 ${pharmacies.length}곳 찾음`
              : '약국 정보 없음'}
          </p>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-[120px] lg:min-h-0 pr-0.5">
            {pharmacies.map((pharmacy, idx) => (
              <button
                key={idx}
                onClick={() => handleListClick(idx)}
                className={`text-left p-3 rounded-xl border transition-colors ${
                  selectedIdx === idx
                    ? 'border-mint-400 bg-mint-50'
                    : 'border-sage-100 bg-white hover:border-mint-200 hover:bg-mint-50/40'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      selectedIdx === idx ? 'text-mint-600' : 'text-mint-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sage-900 truncate">{pharmacy.name}</p>
                    {pharmacy.telephone && (
                      <p className="text-xs text-sage-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        {pharmacy.telephone}
                      </p>
                    )}
                    <p className="text-xs text-sage-400 mt-0.5 truncate">
                      {pharmacy.roadAddress || pharmacy.address}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {!searching && pharmacies.length === 0 && mapReady && (
              <div className="flex flex-col items-center justify-center py-10 text-sage-400 gap-2">
                <MapPin className="w-8 h-8 opacity-40" />
                <p className="text-sm">약국 정보를 불러오지 못했습니다.</p>
                <p className="text-xs text-center">
                  API 키 설정 여부를 확인하거나
                  <br />새로고침 버튼을 눌러주세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
