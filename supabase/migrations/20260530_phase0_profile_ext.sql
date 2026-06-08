-- Phase 0 — Profile Hydration: Extended Profile Fields
-- Run this entire file in Supabase SQL Editor
--
-- Adds all columns needed for the Phase 0 system boot:
--   experience_level, activity_level, available_days, equipment,
--   diet_type, injuries, sleep_hours, stress_level, cardio_preference,
--   gender, weight_unit, height_unit, active_plan_id, last_checkin_date

begin;

alter table public.profiles
  add column if not exists gender text,
  add column if not exists weight_unit text not null default 'kg',
  add column if not exists height_unit text not null default 'cm',
  add column if not exists experience_level text,
  add column if not exists activity_level text,
  add column if not exists available_days int2,
  add column if not exists equipment text,
  add column if not exists diet_type text,
  add column if not exists injuries text,
  add column if not exists sleep_hours numeric(3,1),
  add column if not exists stress_level text,
  add column if not exists cardio_preference text,
  add column if not exists active_plan_id uuid,
  add column if not exists last_checkin_date timestamptz;

-- Add check constraints to keep values clean
alter table public.profiles
  add constraint profiles_gender_check
    check (gender in ('male', 'female', 'other')),
  add constraint profiles_experience_level_check
    check (experience_level in ('beginner', 'intermediate', 'advanced')),
  add constraint profiles_activity_level_check
    check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
  add constraint profiles_equipment_check
    check (equipment in ('gym', 'home_full', 'home_minimal', 'none')),
  add constraint profiles_diet_type_check
    check (diet_type in ('vegetarian', 'non_vegetarian', 'vegan', 'eggetarian')),
  add constraint profiles_stress_level_check
    check (stress_level in ('low', 'moderate', 'high')),
  add constraint profiles_cardio_preference_check
    check (cardio_preference in ('none', 'low', 'moderate', 'high')),
  add constraint profiles_goal_check
    check (goal in ('fat_loss', 'muscle_gain', 'recomposition', 'strength', 'maintenance'));

-- Relax the existing goal constraint to accept new values (drop + recreate)
alter table public.profiles
  drop constraint if exists profiles_goal_check,
  add constraint profiles_goal_check
    check (goal in ('fat_loss', 'muscle_gain', 'recomposition', 'strength', 'maintenance'));

commit;
