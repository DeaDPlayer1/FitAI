-- Profile Redesign — Extended profile tables
-- Run this entire file in Supabase SQL Editor

begin;

-- 1. Add profile redesign columns
alter table public.profiles
  add column if not exists bio text,
  add column if not exists body_fat numeric(4,1),
  add column if not exists fitness_mode text,
  add column if not exists current_program_name text,
  add column if not exists current_week int2 not null default 1,
  add column if not exists total_weeks int2 not null default 12,
  add column if not exists join_date timestamptz not null default now(),
  add column if not exists timezone text,
  add column if not exists notification_enabled boolean not null default true,
  add column if not exists dark_mode boolean not null default false,
  add column if not exists ai_coach_enabled boolean not null default true,
  add column if not exists health_conditions jsonb default '[]'::jsonb;

-- 2. Add new columns to existing activity_logs table (uses logged_at, not logged_date)
alter table public.activity_logs
  add column if not exists workout_completed boolean not null default false,
  add column if not exists minutes_active int2 default 0,
  add column if not exists calories_burned int4 default 0;

-- 3. Achievements table
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  rarity text not null default 'common',
  achieved_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb,
  unique(user_id, title)
);

-- 4. Fitness milestones / journey timeline
create table if not exists public.fitness_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  milestone_type text not null,
  title text not null,
  subtitle text,
  value text,
  icon text,
  achieved_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

-- 5. Recovery logs for the health section
create table if not exists public.recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_date date not null default current_date,
  stress_level int2 check (stress_level between 1 and 10),
  sleep_hours numeric(3,1),
  sleep_quality int2 check (sleep_quality between 1 and 10),
  soreness int2 check (soreness between 1 and 10),
  fatigue int2 check (fatigue between 1 and 10),
  mood int2 check (mood between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  unique(user_id, logged_date)
);

-- Enable RLS on new tables
alter table public.achievements enable row level security;
alter table public.fitness_milestones enable row level security;
alter table public.recovery_logs enable row level security;

-- RLS policies for achievements (DO block to avoid IF NOT EXISTS syntax error)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own achievements' and tablename = 'achievements') then
    create policy "Users can view own achievements" on public.achievements for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own achievements' and tablename = 'achievements') then
    create policy "Users can insert own achievements" on public.achievements for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- RLS policies for milestones
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own milestones' and tablename = 'fitness_milestones') then
    create policy "Users can view own milestones" on public.fitness_milestones for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own milestones' and tablename = 'fitness_milestones') then
    create policy "Users can insert own milestones" on public.fitness_milestones for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- RLS policies for recovery logs
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own recovery logs' and tablename = 'recovery_logs') then
    create policy "Users can view own recovery logs" on public.recovery_logs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can insert own recovery logs' and tablename = 'recovery_logs') then
    create policy "Users can insert own recovery logs" on public.recovery_logs for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can update own recovery logs' and tablename = 'recovery_logs') then
    create policy "Users can update own recovery logs" on public.recovery_logs for update using (auth.uid() = user_id);
  end if;
end $$;

commit;
