-- 마이페이지 "내 등산 기록"(mypage.html)이 사용하는 테이블입니다.
-- Supabase 대시보드의 SQL Editor에서 한 번만 실행하세요. 기존 데이터는 건드리지 않습니다.

begin;

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  visited_on date not null default current_date,
  created_at timestamptz not null default now(),
  -- 같은 날 같은 코스를 두 번 기록하지 않도록 막습니다.
  unique (user_id, course_id, visited_on)
);

create index if not exists visits_user_visited_idx on public.visits(user_id, visited_on desc);

alter table public.visits enable row level security;

drop policy if exists santa_visits_read on public.visits;
drop policy if exists santa_visits_insert on public.visits;
drop policy if exists santa_visits_delete on public.visits;

-- 기록은 본인 것만 읽고, 추가하고, 삭제할 수 있습니다. 수정은 허용하지 않습니다.
create policy santa_visits_read on public.visits
  for select to authenticated using ((select auth.uid()) = user_id);
create policy santa_visits_insert on public.visits
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy santa_visits_delete on public.visits
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.visits from anon, authenticated;
grant select, insert, delete on public.visits to authenticated;
grant usage, select on sequence public.visits_id_seq to authenticated;

commit;
