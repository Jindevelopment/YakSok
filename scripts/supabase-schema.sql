-- =============================================
-- 약속 (Yakssok) - Supabase DB Schema
-- Supabase SQL Editor에서 순서대로 실행하세요
-- =============================================

-- 1. 사용자 프로필 (Supabase Auth users 확장)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  provider text default 'email', -- email | kakao | google | naver
  created_at timestamptz default now(),
  updated_at timestamptz default now()Q
);

-- 2. 의약품 정보 (식약처 API 캐시 + 사용자 등록)
create table if not exists public.medications (
  id uuid default gen_random_uuid() primary key,
  item_seq text unique,           -- 식약처 품목일련번호
  item_name text not null,        -- 약품명
  entp_name text,                 -- 제조사
  class_name text,                -- 분류
  efficacy text,                  -- 효능·효과
  usage_info text,                -- 용법·용량
  caution text,                   -- 주의사항
  side_effect text,               -- 부작용
  interaction_info text,          -- 상호작용
  image_url text,                 -- 약 이미지
  created_at timestamptz default now()
);

-- 3. 복약 일정
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  medication_id uuid references public.medications(id) not null,
  start_date date not null,
  end_date date,
  time_slots text[] not null default '{}', -- ['morning','lunch','dinner','bedtime']
  dosage text,                    -- 1회 복용량
  memo text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. 복약 기록
create table if not exists public.medication_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  medication_id uuid references public.medications(id) not null,
  log_date date not null,
  time_slot text not null,        -- morning | lunch | dinner | bedtime
  taken boolean default false,
  taken_at timestamptz,
  created_at timestamptz default now(),
  unique(schedule_id, log_date, time_slot)
);

-- 5. 약물 상호작용 데이터
create table if not exists public.drug_interactions (
  id uuid default gen_random_uuid() primary key,
  medication_a_id uuid references public.medications(id),
  medication_b_id uuid references public.medications(id),
  severity text check (severity in ('low','medium','high','contraindicated')),
  description text,
  source text default 'mfds',
  created_at timestamptz default now(),
  unique(medication_a_id, medication_b_id)
);

-- 6. AI 챗봇 대화 기록
create table if not exists public.chat_histories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- Row Level Security (RLS) 설정
-- =============================================

alter table public.profiles enable row level security;
alter table public.schedules enable row level security;
alter table public.medication_logs enable row level security;
alter table public.chat_histories enable row level security;

-- profiles: 본인만
create policy "본인 프로필 조회" on public.profiles for select using (auth.uid() = id);
create policy "본인 프로필 수정" on public.profiles for update using (auth.uid() = id);
create policy "회원가입시 프로필 생성" on public.profiles for insert with check (auth.uid() = id);

-- schedules: 본인만
create policy "본인 일정 조회" on public.schedules for select using (auth.uid() = user_id);
create policy "본인 일정 생성" on public.schedules for insert with check (auth.uid() = user_id);
create policy "본인 일정 수정" on public.schedules for update using (auth.uid() = user_id);
create policy "본인 일정 삭제" on public.schedules for delete using (auth.uid() = user_id);

-- medication_logs: 본인만
create policy "본인 복약기록 조회" on public.medication_logs for select using (auth.uid() = user_id);
create policy "본인 복약기록 생성" on public.medication_logs for insert with check (auth.uid() = user_id);
create policy "본인 복약기록 수정" on public.medication_logs for update using (auth.uid() = user_id);

-- chat_histories: 본인만
create policy "본인 채팅 조회" on public.chat_histories for select using (auth.uid() = user_id);
create policy "본인 채팅 생성" on public.chat_histories for insert with check (auth.uid() = user_id);
create policy "본인 채팅 수정" on public.chat_histories for update using (auth.uid() = user_id);

-- medications & drug_interactions: 모두 읽기 가능, 인증 사용자 캐시 저장 가능
alter table public.medications enable row level security;
create policy "의약품 전체 조회" on public.medications for select using (true);
create policy "의약품 캐시 저장" on public.medications for insert with check (true);
create policy "의약품 캐시 갱신" on public.medications for update using (true);

alter table public.drug_interactions enable row level security;
create policy "상호작용 전체 조회" on public.drug_interactions for select using (true);

-- =============================================
-- 자동 프로필 생성 트리거
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'provider', 'email')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();