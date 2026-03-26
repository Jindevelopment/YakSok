# 약속 (Yakssok)

**AI 기반 스마트 복약 관리 서비스**

약품 검색부터 복약 일정 관리, AI 상담까지 한 곳에서.

---

## 주요 기능

- **약 검색** — 약품명 텍스트 검색 또는 사진으로 AI 인식
- **복약 일정** — 시간대별(아침/점심/저녁/취침 전) 복약 일정 등록·관리
- **오늘의 복약** — 오늘 먹을 약을 한눈에 확인하고 체크
- **복약 달력** — 월별 복약 이행률 캘린더 뷰
- **약물 상호작용** — 현재 복용 중인 약들의 상호작용 자동 검사
- **AI 상담** — 복약 방법, 부작용 등 약 관련 질문 채팅 상담

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| AI | Groq — Llama 4 (채팅 상담, 이미지 인식) |
| 의약품 데이터 | 식약처 공공데이터 API (e약은요, 낱알식별정보) |
| 배포 | Vercel |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 아래 값을 채워주세요.

| 변수 | 설명 | 발급 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | [supabase.com](https://supabase.com) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard |
| `GROQ_API_KEY` | Groq API 키 (AI 채팅·이미지) | [console.groq.com](https://console.groq.com) |
| `MFDS_API_KEY` | 식약처 낱알식별 API 키 | [data.go.kr](https://www.data.go.kr) |
| `MFDS_EASY_API_KEY` | 식약처 e약은요 API 키 (선택) | [data.go.kr](https://www.data.go.kr) |

### 3. 데이터베이스 스키마 적용

Supabase Dashboard → SQL Editor에서 `scripts/supabase-schema.sql` 내용을 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

## 프로젝트 구조

```
yakssok/
├── app/
│   ├── page.tsx              # 랜딩 페이지
│   ├── auth/                 # 로그인 · 회원가입
│   ├── dashboard/            # 오늘의 복약
│   ├── search/               # 약 검색
│   ├── schedule/             # 복약 일정
│   ├── calendar/             # 복약 달력
│   ├── interaction/          # 약물 상호작용
│   ├── chat/                 # AI 상담
│   └── api/                  # API Routes
├── components/               # UI 컴포넌트
├── lib/supabase/             # Supabase 클라이언트
├── types/                    # TypeScript 타입 정의
├── scripts/                  # DB 스키마
└── middleware.ts             # 인증 미들웨어
```

## 주의사항

본 서비스는 참고용이며, 의료 진단을 대체하지 않습니다. 정확한 복약 지도는 의사 또는 약사와 상담하세요.
