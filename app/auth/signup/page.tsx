'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

function getKoreanAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'User already registered': '이미 가입된 이메일 주소입니다. 로그인을 시도해 주세요.',
    'Email already in use': '이미 사용 중인 이메일 주소입니다.',
    'Email not confirmed': '이메일 인증이 완료되지 않았습니다. 받으신 인증 메일을 확인해 주세요.',
    'Invalid email': '올바른 이메일 주소 형식이 아닙니다.',
    'Password should be at least': '비밀번호는 8자 이상이어야 합니다.',
    'Signup is disabled': '현재 회원가입이 제한되어 있습니다. 잠시 후 다시 시도해 주세요.',
    'Unable to validate email address': '이메일 주소를 확인할 수 없습니다. 다시 입력해 주세요.',
    'Too many requests': '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  }
  for (const [key, korean] of Object.entries(errorMap)) {
    if (message.includes(key)) return korean
  }
  return '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) {
      toast.error(getKoreanAuthError(error.message))
    } else {
      toast.success('회원가입 완료! 이메일을 확인해 주세요')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  return (
    <div className="card shadow-lg">
      <h1 className="text-2xl font-bold text-sage-900 mb-1">회원가입</h1>
      <p className="text-sm text-sage-500 mb-6">약속과 함께 복약을 관리하세요</p>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">이름</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="홍길동" required className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">이메일</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com" required className="input-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">비밀번호</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="8자 이상" required minLength={8} className="input-base" />
        </div>
        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          가입하기
        </button>
      </form>

      <p className="text-center text-xs text-sage-400 mt-4 leading-relaxed">
        가입하면 <span className="underline">이용약관</span> 및 <span className="underline">개인정보처리방침</span>에 동의하게 됩니다
      </p>
      <p className="text-center text-sm text-sage-500 mt-4">
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/login" className="text-mint-600 font-medium hover:underline">로그인</Link>
      </p>
    </div>
  )
}
