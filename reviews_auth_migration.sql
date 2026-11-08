-- Review locally, then run in Supabase SQL Editor. Does not delete existing users/reviews.
-- Preflight (run separately first; save results):
-- select table_name,column_name,data_type from information_schema.columns where table_schema='public' and table_name in ('users','reviews','reviews_v2');
-- select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' and tablename in ('reviews','reviews_v2','users');
-- select relname,relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relname in ('reviews','reviews_v2');

begin;
-- A separate table avoids reinterpreting or overwriting legacy email-owned records.
create table if not exists public.reviews_v2 (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id),
  mountain_id text not null,
  text text not null check (char_length(btrim(text)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists reviews_v2_mountain_created_idx on public.reviews_v2(mountain_id,created_at desc);
alter table public.reviews_v2 enable row level security;
-- Restrictive policies also constrain any permissive policies already present.
drop policy if exists santa_read on public.reviews_v2;
drop policy if exists santa_insert on public.reviews_v2;
drop policy if exists santa_delete on public.reviews_v2;
drop policy if exists santa_owner_insert_guard on public.reviews_v2;
drop policy if exists santa_owner_delete_guard on public.reviews_v2;
drop policy if exists santa_no_update on public.reviews_v2;
create policy santa_read on public.reviews_v2 for select to anon,authenticated using(true);
create policy santa_insert on public.reviews_v2 for insert to authenticated with check ((select auth.uid())=user_id);
create policy santa_delete on public.reviews_v2 for delete to authenticated using ((select auth.uid())=user_id);
create policy santa_owner_insert_guard on public.reviews_v2 as restrictive for insert to public with check ((select auth.uid())=user_id);
create policy santa_owner_delete_guard on public.reviews_v2 as restrictive for delete to public using ((select auth.uid())=user_id);
create policy santa_no_update on public.reviews_v2 as restrictive for update to public using(false) with check(false);
revoke all on public.reviews_v2 from anon,authenticated;
grant select on public.reviews_v2 to anon,authenticated;
grant insert,delete on public.reviews_v2 to authenticated;
grant usage,select on sequence public.reviews_v2_id_seq to authenticated;
-- Freeze legacy writes without dropping rows or old policies; permissive policies cannot bypass these guards.
do $$ begin
  if to_regclass('public.reviews') is not null then
    execute 'alter table public.reviews enable row level security';
    execute 'drop policy if exists santa_legacy_write_guard on public.reviews';
    execute 'create policy santa_legacy_write_guard on public.reviews as restrictive for all to anon, authenticated using (true) with check (false)';
    execute 'drop policy if exists santa_legacy_delete_guard on public.reviews';
    execute 'create policy santa_legacy_delete_guard on public.reviews as restrictive for delete to anon, authenticated using (false)';
    execute 'drop policy if exists santa_legacy_update_guard on public.reviews';
    execute 'create policy santa_legacy_update_guard on public.reviews as restrictive for update to anon, authenticated using (false)';
  end if;
end $$;
commit;
-- Verify policy results with the preflight queries again.
-- Test using two real Auth accounts: A can insert/delete A; B and anonymous cannot delete A.
-- public.users accounts are NOT automatically auth.users accounts. Register verified Auth users.
-- Do not copy plaintext password_hash values or assign legacy ownership by browser localStorage.
-- Historical reviews remain in reviews; linking/migrating needs separately verified account ownership.
