'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect } from 'react'
import { Search, Camera, Upload, Loader2, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import MedicationCard from '@/components/medicine/MedicationCard'
import type { Medication } from '@/types'

const SHAPES = ['원형', '타원형', '장방형', '반원형', '삼각형', '사각형', '마름모형', '오각형', '육각형', '팔각형', '기타']
const FORM_CODES = ['정제', '필름코팅정', '경질캡슐제', '연질캡슐제', '장용성필름코팅정', '서방성필름코팅정', '츄어블정', '구강붕해정', '발포정']
const COLORS: { label: string; value: string; hex: string }[] = [
  { label: '하양', value: '하양', hex: '#FFFFFF' },
  { label: '노랑', value: '노랑', hex: '#FFD700' },
  { label: '주황', value: '주황', hex: '#FFA500' },
  { label: '분홍', value: '분홍', hex: '#FFB6C1' },
  { label: '빨강', value: '빨강', hex: '#E53E3E' },
  { label: '갈색', value: '갈색', hex: '#8B4513' },
  { label: '연두', value: '연두', hex: '#90EE90' },
  { label: '초록', value: '초록', hex: '#228B22' },
  { label: '청록', value: '청록', hex: '#20B2AA' },
  { label: '파랑', value: '파랑', hex: '#4169E1' },
  { label: '자주', value: '자주', hex: '#9370DB' },
  { label: '회색', value: '회색', hex: '#808080' },
  { label: '검정', value: '검정', hex: '#1A1A1A' },
  { label: '투명', value: '투명', hex: 'transparent' },
]

function ColorPicker({
  selected,
  onChange,
}: {
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map(({ label, value, hex }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(selected === value ? '' : value)}
          title={label}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border-2 transition-all ${
            selected === value
              ? 'border-mint-400 bg-mint-50 text-mint-700 font-medium'
              : 'border-sage-200 text-sage-600 hover:border-sage-300'
          }`}
        >
          <span
            className="w-4 h-4 rounded-full border border-sage-200 shrink-0"
            style={{
              background:
                hex === 'transparent'
                  ? 'linear-gradient(135deg, #fff 45%, #e2e8f0 45%)'
                  : hex,
            }}
          />
          {label}
        </button>
      ))}
    </div>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [imageTab, setImageTab] = useState<'upload' | 'camera'>('upload')
  const [mode, setMode] = useState<'text' | 'image' | 'shape'>('text')
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      setCameraActive(true)
    } catch {
      toast.error('카메라에 접근할 수 없습니다')
    }
  }

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraActive])

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
    stopCamera()
  }

  useEffect(() => () => stopCamera(), [])
  useEffect(() => { if (mode !== 'image') stopCamera() }, [mode])

  const [selectedShape, setSelectedShape] = useState('')
  const [selectedColor1, setSelectedColor1] = useState('')
  const [selectedColor2, setSelectedColor2] = useState('')
  const [markText, setMarkText] = useState('')
  const [selectedForm, setSelectedForm] = useState('')

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    try {
      const res = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.items ?? [])
      if (!data.items?.length) toast('검색 결과가 없습니다', { icon: '🔍' })
    } catch {
      toast.error('검색 중 오류가 발생했습니다')
    }
    setLoading(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('5MB 이하 이미지만 업로드 가능합니다')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleShapeSearch = async () => {
    if (!selectedShape && !selectedColor1 && !selectedColor2 && !markText.trim() && !selectedForm) {
      toast('모양, 색상, 제형 중 하나 이상 선택해주세요', { icon: '💊' })
      return
    }
    setLoading(true)
    setResults([])
    try {
      const params = new URLSearchParams()
      if (selectedShape)    params.set('drug_shape', selectedShape)
      if (selectedColor1)   params.set('color_class1', selectedColor1)
      if (selectedColor2)   params.set('color_class2', selectedColor2)
      if (markText.trim())  params.set('mark_text', markText.trim())
      if (selectedForm)     params.set('form_code', selectedForm)
      const res = await fetch(`/api/medications/shape-search?${params}`)
      const data = await res.json()
      setResults(data.items ?? [])
      if (!data.items?.length) toast('조건에 맞는 약을 찾지 못했습니다', { icon: '🔍' })
    } catch {
      toast.error('검색 중 오류가 발생했습니다')
    }
    setLoading(false)
  }

  const handleImageSearch = async (image: string) => {
    if (!image) return
    setLoading(true)
    setResults([])
    try {
      const res = await fetch('/api/medications/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      setResults(data.candidates ?? [])
      if (!data.candidates?.length) toast('이미지에서 약을 인식하지 못했습니다', { icon: '📷' })
    } catch {
      toast.error('이미지 분석 중 오류가 발생했습니다')
    }
    setLoading(false)
  }

  const hasShapeFilter = selectedShape || selectedColor1 || selectedColor2 || markText || selectedForm
  const resetShapeFilter = () => {
    setSelectedShape('')
    setSelectedColor1('')
    setSelectedColor2('')
    setMarkText('')
    setSelectedForm('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sage-900">약 검색</h1>
        <p className="text-sm text-sage-500 mt-1">약품명 또는 사진으로 의약품 정보를 확인하세요</p>
      </div>

      <div className="flex gap-1 p-1 bg-sage-100 rounded-xl w-fit">
        {([
          { key: 'text',  label: '🔤 이름 검색' },
          { key: 'shape', label: '💊 모양 검색' },
          { key: 'image', label: '📷 사진 검색' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => { setMode(key); setResults([]) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === key ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500 hover:text-sage-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'text' && (
        <form onSubmit={handleTextSearch} className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="약품명 입력 (예: 타이레놀, 아스피린)"
            className="input-base flex-1" />
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2 whitespace-nowrap">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            검색
          </button>
        </form>
      )}

      {mode === 'shape' && (
        <div className="card space-y-5">
          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">알약 모양</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map(shape => (
                <button key={shape} type="button"
                  onClick={() => setSelectedShape(prev => prev === shape ? '' : shape)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                    selectedShape === shape
                      ? 'border-mint-400 bg-mint-50 text-mint-700 font-medium'
                      : 'border-sage-200 text-sage-600 hover:border-sage-300'
                  }`}>
                  {shape}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1">색상 1</p>
            <p className="text-xs text-sage-400 mb-3">주 색상을 선택하세요</p>
            <ColorPicker selected={selectedColor1} onChange={setSelectedColor1} />
          </div>

          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1">
              색상 2 <span className="font-normal normal-case text-sage-400">(선택)</span>
            </p>
            <p className="text-xs text-sage-400 mb-3">투톤 색상이면 두 번째 색도 선택하세요</p>
            <ColorPicker selected={selectedColor2} onChange={setSelectedColor2} />
          </div>

          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">
              제형 <span className="font-normal normal-case text-sage-400">(선택)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {FORM_CODES.map(form => (
                <button key={form} type="button"
                  onClick={() => setSelectedForm(prev => prev === form ? '' : form)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                    selectedForm === form
                      ? 'border-mint-400 bg-mint-50 text-mint-700 font-medium'
                      : 'border-sage-200 text-sage-600 hover:border-sage-300'
                  }`}>
                  {form}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1 block">
              각인 · 인쇄 문자 <span className="font-normal normal-case text-sage-400">(선택)</span>
            </label>
            <p className="text-xs text-sage-400 mb-2">알약에 새겨진 문자나 숫자를 입력하세요</p>
            <input
              type="text"
              value={markText}
              onChange={e => setMarkText(e.target.value)}
              placeholder="예: 500, TY, DW"
              className="input-base w-full"
            />
          </div>

          {hasShapeFilter && (
            <button type="button" onClick={resetShapeFilter}
              className="text-xs text-sage-400 hover:text-sage-600 flex items-center gap-1">
              <X className="w-3 h-3" /> 선택 초기화
            </button>
          )}

          <button onClick={handleShapeSearch} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            모양으로 검색
          </button>
        </div>
      )}

      {mode === 'image' && (
        <div className="space-y-3">
          <div className="card space-y-4">
            {/* 탭 */}
            <div className="flex gap-1 p-1 bg-sage-100 rounded-xl">
              {([
                { key: 'upload' as const, label: '파일 업로드', icon: <Upload className="w-3.5 h-3.5" /> },
                { key: 'camera' as const, label: '직접 촬영',   icon: <Camera  className="w-3.5 h-3.5" /> },
              ]).map(({ key, label, icon }) => (
                <button key={key}
                  onClick={() => {
                    setImageTab(key)
                    if (key === 'upload') { stopCamera(); setCapturedImage(null) }
                    else setImagePreview(null)
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    imageTab === key ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500 hover:text-sage-700'
                  }`}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* ── 파일 업로드 탭 ── */}
            {imageTab === 'upload' && (
              <>
                <div onClick={() => fileRef.current?.click()}
                  className="relative border-2 border-dashed border-sage-200 rounded-xl cursor-pointer hover:border-mint-300 hover:bg-mint-50/50 transition-all overflow-hidden"
                  style={{ aspectRatio: '4/3' }}>
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="미리보기" className="w-full h-full object-contain" />
                      <button onClick={e => { e.stopPropagation(); setImagePreview(null) }}
                        className="absolute top-2 right-2 bg-white/90 text-sage-600 rounded-full p-1.5 shadow hover:bg-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
                      <div className="w-14 h-14 rounded-2xl bg-sage-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-sage-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sage-600">사진을 업로드하세요</p>
                        <p className="text-xs text-sage-400 mt-0.5">JPG, PNG · 최대 5MB</p>
                      </div>
                      <span className="text-xs text-mint-500 font-medium border border-mint-200 bg-mint-50 px-3 py-1 rounded-full">
                        클릭하여 선택
                      </span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <button onClick={() => imagePreview && handleImageSearch(imagePreview)}
                  disabled={!imagePreview || loading}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  AI로 약 찾기
                </button>
              </>
            )}

            {/* ── 직접 촬영 탭 ── */}
            {imageTab === 'camera' && (
              <>
                {/* 대기 상태 */}
                {!cameraActive && !capturedImage && (
                  <div className="relative rounded-xl overflow-hidden border border-sage-200 bg-sage-50"
                    style={{ aspectRatio: '4/3' }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-sage-200 shadow-sm flex items-center justify-center">
                        <Camera className="w-7 h-7 text-mint-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sage-700">알약을 직접 촬영하세요</p>
                        <p className="text-xs text-sage-400 mt-1 leading-relaxed">
                          카메라로 알약 하나를 박스 안에 맞춰 찍으면<br />AI가 약을 찾아드립니다
                        </p>
                      </div>
                      <button onClick={startCamera}
                        className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
                        <Camera className="w-4 h-4" /> 카메라 시작
                      </button>
                    </div>
                  </div>
                )}

                {/* 카메라 촬영 중 */}
                {cameraActive && (
                  <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <p className="text-white text-xs font-medium bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                          알약을 박스 안에 맞춰주세요
                        </p>
                        <div className="relative w-40 h-28">
                          <span className="absolute top-0    left-0   w-5 h-5 border-t-2 border-l-2 border-mint-300 rounded-tl" />
                          <span className="absolute top-0    right-0  w-5 h-5 border-t-2 border-r-2 border-mint-300 rounded-tr" />
                          <span className="absolute bottom-0 left-0   w-5 h-5 border-b-2 border-l-2 border-mint-300 rounded-bl" />
                          <span className="absolute bottom-0 right-0  w-5 h-5 border-b-2 border-r-2 border-mint-300 rounded-br" />
                        </div>
                      </div>
                    </div>
                    <button onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-14 h-14 rounded-full bg-white border-[3px] border-mint-400 shadow-lg hover:scale-105 active:scale-95 transition-transform" />
                  </div>
                )}

                {/* 촬영 완료 */}
                {capturedImage && (
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
                    <img src={capturedImage} alt="촬영된 약" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                    <button onClick={() => { setCapturedImage(null); startCamera() }}
                      className="absolute top-2 right-2 bg-white/90 text-sage-600 rounded-full p-1.5 shadow hover:bg-white transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap">
                      다시 찍으려면 X를 눌러주세요
                    </span>
                  </div>
                )}

                {cameraActive && (
                  <button onClick={stopCamera}
                    className="w-full py-2 text-sm text-sage-400 hover:text-sage-600 transition-colors">
                    취소
                  </button>
                )}
                {capturedImage && (
                  <button onClick={() => handleImageSearch(capturedImage)} disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    AI로 약 찾기
                  </button>
                )}
              </>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">AI가 후보 약품을 제안하며, 정확도는 100%가 아닐 수 있습니다. 반드시 직접 확인하세요.</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
          <p className="text-sage-500 text-sm">{mode === 'image' ? 'AI가 약을 분석하고 있습니다...' : '검색 중...'}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-sage-500 font-medium">검색 결과 {results.length}개</p>
          {results.map(med => (
            <MedicationCard key={med.id} medication={med} showAddButton />
          ))}
        </div>
      )}
    </div>
  )
}
