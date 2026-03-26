'use client'
import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

// UX-03: error.message 직접 노출 대신 사용자 친화적 메시지로 교체
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  'Failed to fetch': '네트워크 연결을 확인해 주세요.',
  'NetworkError': '네트워크 연결을 확인해 주세요.',
  'Load failed': '데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
}

function getFriendlyMessage(error: Error): string {
  for (const [key, msg] of Object.entries(USER_FRIENDLY_MESSAGES)) {
    if (error.message.includes(key)) return msg
  }
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  const friendlyMessage = getFriendlyMessage(error)

  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl" role="img" aria-label="오류">!</span>
        </div>
        <h2 className="text-xl font-bold text-sage-900 mb-2">오류가 발생했습니다</h2>
        <p className="text-sage-500 mb-6 text-sm leading-relaxed">{friendlyMessage}</p>
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          다시 시도
        </button>
      </div>
    </div>
  )
}
