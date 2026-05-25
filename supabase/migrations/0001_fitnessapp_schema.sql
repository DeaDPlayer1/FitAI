-- FIX[1][2][3][4]: Single migration for FitnessApp schema + RLS policies.
-- Run this entire file in Supabase SQL Editor.

begin;

-- Extensions required for gen_random_uuid() and GIN over scalar types
create extension if not exists pgcrypto;
create extension if not exists btree_gin;

-- Drop existing tables so schema matches exactly
drop table if exists public.meal_logs cascade;
drop table if exists public.weight_logs cascade;
drop table if exists public.workout_logs cascade;
drop table if exists public.profiles cascade;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age int2,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  goal text,
  health_conditions text[],
  onboarding_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles add constraint profiles_id_unique unique (id);

-- meal_logs
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_name text not null,
  calories numeric(7,2),
  protein_g numeric(6,2),
  carbs_g numeric(6,2),
  fat_g numeric(6,2),
  meal_type text,
  logged_at timestamptz not null default now()
);

-- weight_logs
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(5,2) not null,
  note text,
  logged_at timestamptz not null default now()
);

-- workout_logs
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text,
  exercises jsonb not null,
  source text,
  duration_minutes int2,
  logged_at timestamptz not null default now()
);

-- Indexes (GIN as requested; uses btree_gin)
create index if not exists meal_logs_user_id_logged_at_gin
  on public.meal_logs using gin (user_id, logged_at);

create index if not exists workout_logs_user_id_logged_at_gin
  on public.workout_logs using gin (user_id, logged_at);

-- Enable RLS everywhere
alter table public.profiles enable row level security;
alter table public.meal_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.workout_logs enable row level security;

-- Policies: profiles uses id = auth.uid()
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
on public.profiles
for delete
using (id = auth.uid());

-- Policies: meal_logs uses user_id = auth.uid()
drop policy if exists meal_logs_select_own on public.meal_logs;
create policy meal_logs_select_own
on public.meal_logs
for select
using (user_id = auth.uid());

drop policy if exists meal_logs_insert_own on public.meal_logs;
create policy meal_logs_insert_own
on public.meal_logs
for insert
with check (user_id = auth.uid());

drop policy if exists meal_logs_update_own on public.meal_logs;
create policy meal_logs_update_own
on public.meal_logs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists meal_logs_delete_own on public.meal_logs;
create policy meal_logs_delete_own
on public.meal_logs
for delete
using (user_id = auth.uid());

-- Policies: weight_logs uses user_id = auth.uid()
drop policy if exists weight_logs_select_own on public.weight_logs;
create policy weight_logs_select_own
on public.weight_logs
for select
using (user_id = auth.uid());

drop policy if exists weight_logs_insert_own on public.weight_logs;
create policy weight_logs_insert_own
on public.weight_logs
for insert
with check (user_id = auth.uid());

drop policy if exists weight_logs_update_own on public.weight_logs;
create policy weight_logs_update_own
on public.weight_logs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists weight_logs_delete_own on public.weight_logs;
create policy weight_logs_delete_own
on public.weight_logs
for delete
using (user_id = auth.uid());

-- Policies: workout_logs uses user_id = auth.uid()
drop policy if exists workout_logs_select_own on public.workout_logs;
create policy workout_logs_select_own
on public.workout_logs
for select
using (user_id = auth.uid());

drop policy if exists workout_logs_insert_own on public.workout_logs;
create policy workout_logs_insert_own
on public.workout_logs
for insert
with check (user_id = auth.uid());

drop policy if exists workout_logs_update_own on public.workout_logs;
create policy workout_logs_update_own
on public.workout_logs
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists workout_logs_delete_own on public.workout_logs;
create policy workout_logs_delete_own
on public.workout_logs
for delete
using (user_id = auth.uid());

commit;

