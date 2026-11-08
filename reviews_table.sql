-- 산타(SanTa) : users + reviews 테이블 생성
-- (기존 logIn.html / signIn.html / detail.html 구조 그대로 반영, 비밀번호 노출만 차단)
-- Supabase 대시보드 > SQL Editor 에서 전체 실행

-- ============================================
-- 1. users 테이블 (회원가입/로그인용)
-- ============================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- 회원가입(INSERT)은 누구나 가능해야 함
create policy "누구나 회원가입 가능"
  on public.users
  for insert
  with check (true);

-- 주의: users 테이블 자체는 SELECT를 막는다 (password_hash 평문 노출 방지)
-- 로그인 화면에서 비밀번호를 직접 비교하던 방식은 더 이상 동작하지 않으므로
-- 아래 login_user() 함수를 통해서만 로그인 검증을 수행한다.

-- 비밀번호를 제외한 공개용 뷰 (필요 시 닉네임 등 조회용)
create or replace view public.users_public as
  select id, nickname, email, created_at from public.users;

-- ============================================
-- 2. 로그인 검증 함수 (비밀번호를 클라이언트로 내려주지 않고 서버에서만 비교)
-- ============================================
create or replace function public.login_user(p_email text, p_password text)
returns table (id uuid, nickname text, email text)
language sql
security definer
set search_path = public
as $$
  select id, nickname, email
  from public.users
  where email = p_email and password_hash = p_password;
$$;

-- 이 함수는 누구나 호출 가능해야 로그인이 동작함 (내부적으로 비교만 하고 결과만 반환)
grant execute on function public.login_user(text, text) to anon, authenticated;

-- ============================================
-- 3. reviews 테이블 (기존 detail.html 구조 그대로: course_id, user_email, content)
-- ============================================
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  course_id text not null,
  user_email text not null references public.users(email) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists reviews_course_id_idx on public.reviews (course_id);

alter table public.reviews enable row level security;

-- 조회: 누구나 가능
create policy "누구나 후기 조회 가능"
  on public.reviews
  for select
  using (true);

-- 작성: 누구나 가능 (user_email이 실존 회원이어야 함은 FK로 보장)
create policy "회원이면 후기 작성 가능"
  on public.reviews
  for insert
  with check (true);

-- 삭제: 열어둠 (※ 아래 '한계' 참고 — 완전한 서버 검증은 Supabase Auth 전환 전까지 불가능)
create policy "후기 삭제 허용"
  on public.reviews
  for delete
  using (true);
