# 약속 (Yakssok)

**AI 기반 스마트 복약 관리 서비스**

약품 검색부터 복약 일정 관리, AI 상담까지 한 곳에서.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 약 검색 | 약품명 텍스트 검색 또는 사진으로 AI 인식 |
| 낱알식별 모양 검색 | 색상·모양·刻印(각인)으로 모르는 약 찾기 |
| 복약 일정 | 시간대별(아침/점심/저녁/취침 전) 복약 일정 등록·관리 |
| 오늘의 복약 | 오늘 먹을 약을 한눈에 확인하고 체크 |
| 복약 달력 | 월별 복약 이행률 캘린더 뷰 |
| 약물 상호작용 | 복용 중인 약들의 상호작용 자동 검사 |
| AI 상담 | 복약 방법, 부작용 등 약 관련 질문 채팅 상담 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth) |
| AI | Groq — Llama 4 (채팅 상담, 이미지 인식) |
| 의약품 데이터 | 식약처 공공데이터 API (e약은요, 낱알식별정보) |
| 배포 | Vercel |

---

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/Jindevelopment/YakSok.git
cd YakSok
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`에 아래 값을 채워주세요.

| 변수 | 설명 | 발급처 |
|------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | [supabase.com](https://supabase.com) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Project Settings → API |
| `GROQ_API_KEY` | Groq API 키 (AI 채팅·이미지 인식) | [console.groq.com](https://console.groq.com) |
| `MFDS_API_KEY` | 식약처 낱알식별 API 키 | [data.go.kr](https://www.data.go.kr) — "의약품 낱알식별 정보 서비스" |
| `MFDS_EASY_API_KEY` | 식약처 e약은요 API 키 (선택) | [data.go.kr](https://www.data.go.kr) — "e약은요 서비스" |
| `MFDS_GRAIN_API_KEY` | 식약처 낱알식별 모양 검색 키 (선택) | [data.go.kr](https://www.data.go.kr) — "의약품 낱알식별 정보 서비스" |

> `MFDS_EASY_API_KEY`와 `MFDS_GRAIN_API_KEY`는 선택 사항입니다. 없어도 기본 검색은 동작합니다.

### 3. 데이터베이스 스키마 적용

Supabase Dashboard → SQL Editor에서 `scripts/supabase-schema.sql` 전체 내용을 붙여넣고 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

---

## 프로젝트 구조

```
yakssok/
├── app/
│   ├── page.tsx                  # 랜딩 페이지
│   ├── auth/                     # 로그인 · 회원가입
│   ├── dashboard/                # 오늘의 복약 대시보드
│   ├── search/                   # 약 검색 (텍스트 · 이미지 · 모양)
│   ├── schedule/                 # 복약 일정 등록·관리
│   ├── calendar/                 # 월별 복약 달력
│   ├── interaction/              # 약물 상호작용 검사
│   ├── chat/                     # AI 복약 상담
│   └── api/
│       ├── medications/
│       │   ├── search/           # 텍스트 검색 + 식약처 API 캐싱
│       │   ├── image-search/     # 이미지 → AI 약품명 추출
│       │   ├── detail/           # 약품 상세 정보 (용법·부작용 등)
│       │   └── shape-search/     # 낱알식별 모양 검색
│       ├── interactions/check/   # 약물 상호작용 조회
│       ├── chat/                 # AI 챗봇 (Groq Llama)
│       └── auth/logout/          # 로그아웃
├── components/                   # 재사용 UI 컴포넌트
├── lib/supabase/                 # Supabase 클라이언트 (server / client)
├── types/                        # TypeScript 타입 정의
├── scripts/
│   ├── supabase-schema.sql       # DB 스키마 (초기 실행 필요)
│   └── import-pill-shapes.ts     # 낱알식별 데이터 임포트 스크립트
└── middleware.ts                  # 인증 미들웨어 (보호 라우트 처리)
```

---

## 데이터베이스 테이블

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (auth.users 연동) |
| `medications` | 식약처 약품 정보 캐시 |
| `schedules` | 사용자 복약 일정 |
| `medication_logs` | 일별 복약 체크 기록 |
| `drug_interactions` | 약물 상호작용 데이터 |
| `chat_histories` | AI 채팅 대화 기록 |

모든 테이블은 Supabase RLS(Row Level Security)가 적용되어 있어 사용자 본인의 데이터만 접근 가능합니다.

---

## 주의사항

본 서비스는 참고용이며, 의료 진단을 대체하지 않습니다. 정확한 복약 지도는 의사 또는 약사와 상담하세요.
