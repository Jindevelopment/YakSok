'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('이메일 또는 비밀번호가 올바르지 않습니다')
    } else {
      toast.success('로그인 성공!')
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) toast.error('소셜 로그인에 실패했습니다')
  }

  return (
    <div className="card shadow-lg">
      <h1 className="text-2xl font-bold text-sage-900 mb-1">로그인</h1>
      <p className="text-sm text-sage-500 mb-6">복약 관리를 계속하세요</p>

      {/* 소셜 로그인 */}
      <div className="space-y-2 mb-6">
        <button onClick={() => handleSocialLogin('google')}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-sage-200 bg-white hover:bg-sage-50 transition-colors text-sm font-medium text-sage-700">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 계속하기
        </button>
        <button onClick={() => handleSocialLogin('kakao')}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#FEE500] hover:bg-[#FFDC00] transition-colors text-sm font-medium text-[#3C1E1E]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.64 5.19 4.13 6.57L5.1 21l5.03-2.67c.61.08 1.23.12 1.87.12 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
          </svg>
          카카오로 계속하기
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-sage-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-sage-400">또는 이메일로</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">이메일</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com" required className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">비밀번호</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호 입력" required className="input-base pr-11" />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center">
              {showPw
                ? <EyeOff className="w-5 h-5" aria-hidden="true" />
                : <Eye className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          로그인
        </button>
      </form>

      <p className="text-center text-sm text-sage-500 mt-6">
        계정이 없으신가요?{' '}
        <Link href="/auth/signup" className="text-mint-600 font-medium hover:underline">회원가입</Link>
      </p>
    </div>
  )
}
