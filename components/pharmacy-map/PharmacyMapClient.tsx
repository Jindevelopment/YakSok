'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation, RefreshCw, AlertCircle, Phone, Search, ExternalLink } from 'lucide-react'

interface Pharmacy {
  name: string
  address: string
  roadAddress: string
  telephone: string
  link: string
  category: string
  lat: number
  lng: number
  distance: number | null
}

function formatDistance(m: number | null): string {
  if (m === null) return ''
  if (m < 1000) return `${m}m`
  return `${(m / 1000).toFixed(1)}km`
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
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [mapMoved, setMapMoved] = useState(false)

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

    const distText = pharmacy.distance !== null ? `<span style="margin-left:6px;font-size:11px;color:#22c77a;font-weight:600">${formatDistance(pharmacy.distance)}</span>` : ''
    const getLinkLabel = (url: string) => {
      try {
        const host = new URL(url).hostname
        if (host === 'place.naver.com' || host.startsWith('place.naver')) return '네이버 플레이스 보기 ↗'
        if (host.includes('blog.naver.com')) return '네이버 블로그 보기 ↗'
        if (host.includes('naver.com')) return '네이버 보기 ↗'
        if (host.includes('instagram.com')) return '인스타그램 보기 ↗'
        if (host.includes('facebook.com')) return '페이스북 보기 ↗'
        return '홈페이지 보기 ↗'
      } catch { return '바로가기 ↗' }
    }
    const linkBtn = pharmacy.link ? `<a href="${pharmacy.link}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:11px;color:#22c77a;text-decoration:none;font-weight:600">${getLinkLabel(pharmacy.link)}</a>` : ''
    infoWindowRef.current = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding:12px 14px;max-width:240px;font-family:'Pretendard',sans-serif;line-height:1.4">
          <p style="margin:0;font-size:13px;font-weight:700;color:#145436">${pharmacy.name}${distText}</p>
          ${pharmacy.category ? `<p style="margin:3px 0 0;font-size:11px;color:#aab5ac">${pharmacy.category}</p>` : ''}
          ${pharmacy.telephone ? `<p style="margin:6px 0 0;font-size:12px;color:#576e5a">📞 ${pharmacy.telephone}</p>` : ''}
          <p style="margin:4px 0 0;font-size:11px;color:#8a9a8c">${pharmacy.roadAddress || pharmacy.address || ''}</p>
          ${linkBtn}
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
      const pillIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`
      const marker = new window.naver.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          content: `
            <div style="width:40px;height:40px;background:#22c77a;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2.5px solid white;cursor:pointer">
              ${pillIcon}
            </div>
          `,
          anchor: new window.naver.maps.Point(20, 20),
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
    setMapMoved(false)
    try {
      const delta = 0.014
      let bboxParam =
        `&south=${lat - delta}&west=${lng - delta * 1.3}` +
        `&north=${lat + delta}&east=${lng + delta * 1.3}`
      try {
        const bounds = mapRef.current?.getBounds?.()
        if (bounds) {
          const sw = bounds.getSW()
          const ne = bounds.getNE()
          const latSpan = ne.lat() - sw.lat()
          const lngSpan = ne.lng() - sw.lng()
          if (latSpan > 0.001 && lngSpan > 0.001) {
            bboxParam =
              `&south=${sw.lat()}&west=${sw.lng()}` +
              `&north=${ne.lat()}&east=${ne.lng()}`
          }
        }
      } catch {}

      const userParam = userCoordsRef.current
        ? `&userLat=${userCoordsRef.current.lat}&userLng=${userCoordsRef.current.lng}`
        : ''

      const res = await fetch(`/api/pharmacy/search?lat=${lat}&lng=${lng}${bboxParam}${userParam}`)
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

    window.naver.maps.Event.addListener(mapRef.current, 'click', () => {
      infoWindowRef.current?.close()
      infoWindowRef.current = null
      setSelectedIdx(null)
    })

    window.naver.maps.Event.addListener(mapRef.current, 'dragend', () => {
      setMapMoved(true)
    })

    window.naver.maps.Event.addListener(mapRef.current, 'zoom_changed', () => {
      setMapMoved(true)
    })

    setMapReady(true)
  }, [])

  const initMapAndSearch = useCallback((lat: number, lng: number) => {
    initMap(lat, lng)
    if (mapRef.current) {
      const listener = window.naver.maps.Event.addListener(
        mapRef.current, 'idle', () => {
          window.naver.maps.Event.removeListener(listener)
          searchPharmacies(lat, lng)
        }
      )
    } else {
      searchPharmacies(lat, lng)
    }
  }, [initMap, searchPharmacies])

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      userCoordsRef.current = { lat: FALLBACK_LAT, lng: FALLBACK_LNG }
      setUserCoords({ lat: FALLBACK_LAT, lng: FALLBACK_LNG })
      setLocationError('위치 정보를 지원하지 않는 브라우저입니다. 서울 시청을 기준으로 표시합니다.')
      initMapAndSearch(FALLBACK_LAT, FALLBACK_LNG)
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        userCoordsRef.current = { lat, lng }
        setUserCoords({ lat, lng })
        initMapAndSearch(lat, lng)
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? '위치 권한이 거부되었습니다.'
            : err.code === err.TIMEOUT
            ? '위치 정보 요청 시간이 초과되었습니다.'
            : '위치 정보를 가져올 수 없습니다.'
        userCoordsRef.current = { lat: FALLBACK_LAT, lng: FALLBACK_LNG }
        setUserCoords({ lat: FALLBACK_LAT, lng: FALLBACK_LNG })
        setLocationError(`${msg} 서울 시청을 기준으로 표시합니다.`)
        initMapAndSearch(FALLBACK_LAT, FALLBACK_LNG)
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    )
  }, [initMapAndSearch])

  useEffect(() => {
    if (!clientId) return

    if (window.naver?.maps) {
      getUserLocation()
    } else {
      const existing = document.querySelector(
        'script[src^="https://openapi.map.naver.com"]'
      ) as HTMLScriptElement | null

      if (existing) {
        // 스크립트가 이미 로드 완료된 경우 load 이벤트가 재발화되지 않으므로 polling으로 대기
        const waitForNaver = () => {
          if (window.naver?.maps) {
            getUserLocation()
          } else {
            setTimeout(waitForNaver, 100)
          }
        }
        existing.addEventListener('error', () =>
          setMapError('네이버 지도 스크립트를 불러오지 못했습니다. API 키를 확인해주세요.')
        )
        waitForNaver()
      } else {
        const script = document.createElement('script')
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`
        script.async = true
        script.onload = () => getUserLocation()
        script.onerror = () => {
          setMapError('네이버 지도 스크립트를 불러오지 못했습니다. API 키를 확인해주세요.')
        }
        document.head.appendChild(script)
      }
    }

    return () => {
      mapRef.current = null
    }
  }, [clientId, getUserLocation])

  const handleGoToMyLocation = () => {
    if (!mapRef.current || !userCoords || !window.naver?.maps) return
    mapRef.current.panTo(new window.naver.maps.LatLng(userCoords.lat, userCoords.lng))
  }

  const handleSearchThisArea = () => {
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
            onClick={handleSearchThisArea}
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
          {mapMoved && !searching && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={handleSearchThisArea}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-sage-200 text-sage-700 shadow-md hover:bg-sage-50 transition-colors"
              >
                <Search className="w-4 h-4 text-mint-500" />
                이 지역에서 검색
              </button>
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-sage-900 truncate">{pharmacy.name}</p>
                      {pharmacy.distance !== null && (
                        <span className="shrink-0 text-xs font-semibold text-mint-600 bg-mint-50 px-1.5 py-0.5 rounded-full">
                          {formatDistance(pharmacy.distance)}
                        </span>
                      )}
                    </div>
                    {pharmacy.category && (
                      <p className="text-xs text-sage-400 mt-0.5">{pharmacy.category}</p>
                    )}
                    {pharmacy.telephone && (
                      <p className="text-xs text-sage-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        {pharmacy.telephone}
                      </p>
                    )}
                    <p className="text-xs text-sage-400 mt-0.5 truncate">
                      {pharmacy.roadAddress || pharmacy.address}
                    </p>
                    {pharmacy.link && (
                      <a
                        href={pharmacy.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-mint-600 hover:text-mint-700 font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {(() => {
                          try {
                            const host = new URL(pharmacy.link).hostname
                            if (host === 'place.naver.com' || host.startsWith('place.naver')) return '네이버 플레이스'
                            if (host.includes('blog.naver.com')) return '네이버 블로그'
                            if (host.includes('naver.com')) return '네이버'
                            if (host.includes('instagram.com')) return '인스타그램'
                            if (host.includes('facebook.com')) return '페이스북'
                            return '홈페이지'
                          } catch { return '바로가기' }
                        })()}
                      </a>
                    )}
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
