-- FIX: Document/enable RLS policies for user-owned tables.
-- Apply this in Supabase SQL Editor (or convert into migrations if you use CLI).

-- Profiles (id = auth.uid())
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- Meal logs (user_id = auth.uid())
alter table public.meal_logs enable row level security;

drop policy if exists "meal_logs_select_own" on public.meal_logs;
create policy "meal_logs_select_own"
on public.meal_logs
for select
using (user_id = auth.uid());

drop policy if exists "meal_logs_insert_own" on public.meal_logs;
create policy "meal_logs_insert_own"
on public.meal_logs
for insert
with check (user_id = auth.uid());

drop policy if exists "meal_logs_update_own" on public.meal_logs;
create policy "meal_logs_update_own"
on public.meal_logs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "meal_logs_delete_own" on public.meal_logs;
create policy "meal_logs_delete_own"
on public.meal_logs
for delete
using (user_id = auth.uid());

-- Weight logs (user_id = auth.uid())
alter table public.weight_logs enable row level security;

drop policy if exists "weight_logs_select_own" on public.weight_logs;
create policy "weight_logs_select_own"
on public.weight_logs
for select
using (user_id = auth.uid());

drop policy if exists "weight_logs_insert_own" on public.weight_logs;
create policy "weight_logs_insert_own"
on public.weight_logs
for insert
with check (user_id = auth.uid());

drop policy if exists "weight_logs_delete_own" on public.weight_logs;
create policy "weight_logs_delete_own"
on public.weight_logs
for delete
using (user_id = auth.uid());

