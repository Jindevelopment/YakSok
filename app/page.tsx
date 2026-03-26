import Link from 'next/link'
import { Pill, Camera, CalendarDays, ShieldAlert, Bot } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-sage-50">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-mint-500 rounded-xl flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-sage-900">약속</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm">로그인</Link>
          <Link href="/auth/signup" className="btn-primary text-sm">시작하기</Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-mint-50 text-mint-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 bg-mint-400 rounded-full animate-pulse" />
          AI 기반 스마트 복약 관리
        </div>
        <h1 className="text-5xl font-bold text-sage-900 leading-tight mb-5">
          약, 속 시원하게<br />
          <span className="text-mint-500">관리하다</span>
        </h1>
        <p className="text-lg text-sage-500 mb-10 max-w-xl mx-auto leading-relaxed">
          약 사진 한 장으로 정보를 조회하고, 복약 일정을 체계적으로 관리하세요.
          약물 상호작용도 자동으로 확인해드립니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="btn-primary text-base px-8 py-3 flex items-center gap-2 justify-center">
            <Camera className="w-5 h-5" /> 약 사진으로 검색
          </Link>
          <Link href="/auth/signup" className="btn-secondary text-base px-8 py-3">
            복약 일정 관리 시작
          </Link>
        </div>
      </section>

      {/* 기능 카드 */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Camera,
              title: 'AI 이미지 검색',
              desc: '약 사진을 업로드하면 AI가 자동으로 의약품을 인식합니다',
              color: 'text-purple-500 bg-purple-50',
              href: '/search',
            },
            {
              icon: CalendarDays,
              title: '복약 일정 관리',
              desc: '아침·점심·저녁·취침 시간대별로 복약 일정을 등록하세요',
              color: 'text-mint-600 bg-mint-50',
              href: '/auth/signup',
            },
            {
              icon: ShieldAlert,
              title: '약물 상호작용',
              desc: '복용 중인 약의 위험한 조합을 자동으로 감지합니다',
              color: 'text-red-500 bg-red-50',
              href: '/auth/signup',
            },
            {
              icon: Bot,
              title: 'AI 상담 챗봇',
              desc: '약에 관한 궁금한 점을 AI에게 물어보세요',
              color: 'text-blue-500 bg-blue-50',
              href: '/auth/signup',
            },
          ].map(({ icon: Icon, title, desc, color, href }) => (
            <Link key={title} href={href}
              className="card hover:shadow-md hover:-translate-y-1 transition-all duration-200 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sage-800 mb-2">{title}</h3>
              <p className="text-sm text-sage-500 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="text-center pb-10 text-sm text-sage-400">
        © 2026 약속 · 본 서비스는 참고용이며 의료 진단을 대체하지 않습니다
      </footer>
    </main>
  )
}
