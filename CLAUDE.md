# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**약속 (Yakssok)** — AI-based smart medication management service. Users can search medications by text or image, set schedules, track daily intake, check drug interactions, and consult an AI chatbot.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase admin |
| `GEMINI_API_KEY` | Gemini 2.0 Flash (챗봇 + 이미지 인식) |
| `MFDS_API_KEY` / `MFDS_EASY_API_KEY` | 식약처 medication data |

Apply DB schema by running `supabase-schema.sql` in the Supabase Dashboard SQL editor.

## Architecture

**Next.js 14 App Router** with Supabase (PostgreSQL + Auth) backend. Route protection is handled entirely in `middleware.ts` — protected routes redirect unauthenticated users to `/auth/login`.

### API Routes (`app/api/`)

| Route | Description |
|-------|-------------|
| `GET /api/medications/search` | MFDS API search with Supabase caching (1-hour TTL via upsert) |
| `POST /api/medications/image-search` | Google Vision OCR → medication name extraction → DB lookup |
| `POST /api/interactions/check` | Bidirectional drug interaction lookup in `drug_interactions` table |
| `POST /api/chat` | Groq (Llama) Korean-only medication chatbot, last 20 messages history |
| `POST /api/auth/logout` | Supabase sign-out |

### Supabase Client Pattern

- `lib/supabase/client.ts` — Browser client (for Client Components)
- `lib/supabase/server.ts` — Server client using cookies (for Server Components & API routes)

### Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User metadata, synced via trigger on `auth.users` |
| `medications` | MFDS drug info cache (upserted on search) |
| `schedules` | User medication plans with `time_slots` array and date range |
| `medication_logs` | Daily per-slot intake records (taken: boolean) |
| `drug_interactions` | Drug pair severity (`low`/`medium`/`high`/`contraindicated`) |
| `chat_histories` | Conversation messages as JSONB per user |

All tables use Supabase RLS — users only access their own rows.

### Key Types (`types/index.ts`)

- `TimeSlot`: `'morning' | 'lunch' | 'dinner' | 'bedtime'`
- `Severity`: `'low' | 'medium' | 'high' | 'contraindicated'`
- `Provider`: `'email' | 'kakao' | 'google' | 'naver'`

### Styling

Tailwind CSS with custom theme colors `mint` and `sage` (defined in `tailwind.config.js`). Font: Pretendard. Use the `cn()` utility from `lib/utils.ts` for conditional class merging.
