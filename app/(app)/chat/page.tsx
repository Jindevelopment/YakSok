'use client'
export const dynamic = 'force-dynamic'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function createMessage(role: Message['role'], content: string): Message {
  return { id: crypto.randomUUID(), role, content }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage('assistant', '안녕하세요! 저는 약속의 AI 상담 도우미입니다 💊\n\n복약 방법, 약물 부작용, 의약품 정보 등 궁금한 점을 자유롭게 물어보세요.\n\n⚠️ 본 서비스는 참고용이며 의료 진단을 대체하지 않습니다.')
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMessage = createMessage('user', text)
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const apiMessages = [...messages, userMessage].map(({ role, content }) => ({ role, content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, createMessage('assistant', data.reply ?? '답변을 생성하지 못했습니다.')])
    } catch {
      toast.error('네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.')
      setMessages(prev => [...prev, createMessage('assistant', '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')])
    }
    setLoading(false)
  }

  const QUICK = ['타이레놀 하루 최대 용량이 얼마인가요?', '공복에 먹으면 안 되는 약이 있나요?', '항생제를 중간에 끊어도 되나요?']

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-sage-900">AI 상담</h1>
        <p className="text-sm text-sage-500 mt-1">약에 관한 궁금한 점을 물어보세요</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m) => (
          <div key={m.id} className={clsx('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              m.role === 'assistant' ? 'bg-mint-100' : 'bg-sage-200'
            )}>
              {m.role === 'assistant'
                ? <Bot className="w-4 h-4 text-mint-600" />
                : <User className="w-4 h-4 text-sage-600" />}
            </div>
            <div className={clsx(
              'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line',
              m.role === 'assistant'
                ? 'bg-white border border-sage-100 text-sage-800'
                : 'bg-mint-500 text-white'
            )}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-mint-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-mint-600" />
            </div>
            <div className="bg-white border border-sage-100 px-4 py-3 rounded-2xl flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-mint-500 animate-spin" />
              <span className="text-sm text-sage-400">답변 생성 중...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {QUICK.map(q => (
            <button key={q} onClick={() => { setInput(q) }}
              className="shrink-0 text-xs bg-white border border-sage-200 text-sage-600 px-3 py-2 rounded-xl hover:border-mint-300 hover:text-mint-700 transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 py-2">
        <AlertCircle className="w-3 h-3 text-sage-400 shrink-0" />
        <p className="text-xs text-sage-400">참고용 정보입니다. 의료 진단을 대체하지 않습니다.</p>
      </div>

      <div className="flex gap-2" role="form" aria-label="메시지 입력">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="약에 대해 궁금한 점을 입력하세요..."
          aria-label="메시지 입력"
          className="input-base flex-1"
          disabled={loading} />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          aria-label={loading ? '전송 중' : '메시지 전송'}
          className="btn-primary min-w-[44px] min-h-[44px] flex items-center justify-center">
          {loading
            ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            : <Send className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
