-- =====================================================================
-- Migration: Initial Schema for 10xFitChart
-- Purpose: Create core database schema for workout tracking application
-- Date: 2026-01-16
-- 
-- This migration creates:
-- - exercise_type enum (strength, cardio)
-- - exercises table (exercise dictionary with global and user-specific)
-- - workouts table (workout session headers)
-- - workout_sets table (individual sets/activities within workouts)
-- - Performance indexes for queries
-- - Row Level Security policies for all tables
-- - Automatic updated_at triggers using moddatetime extension
-- =====================================================================

-- =====================================================================
-- 1. EXTENSIONS
-- =====================================================================

-- Enable moddatetime extension for automatic updated_at management
create extension if not exists moddatetime schema extensions;

-- =====================================================================
-- 2. ENUM TYPES
-- =====================================================================

-- Create enum for exercise types
-- Defines whether an exercise is strength-based or cardio-based
create type exercise_type as enum ('strength', 'cardio');

-- =====================================================================
-- 3. TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: exercises
-- Purpose: Exercise dictionary containing both system-wide (global) 
--          and user-specific exercises
-- Notes:
--   - user_id NULL indicates a system/global exercise
--   - is_archived implements soft delete (exercises are never hard deleted)
--   - type determines which metrics are relevant (weight/reps vs distance/time)
-- ---------------------------------------------------------------------
create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name varchar(100) not null,
  type exercise_type not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for exercises table
-- This ensures users can only see global exercises and their own exercises
alter table exercises enable row level security;

-- ---------------------------------------------------------------------
-- Table: workouts
-- Purpose: Workout session headers representing a single training day
-- Notes:
--   - One workout per date is typical but not enforced
--   - notes field is optional for user annotations
--   - All workouts are user-owned and cascade deleted with user
-- ---------------------------------------------------------------------
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for workouts table
-- Ensures users can only access their own workouts
alter table workouts enable row level security;

-- ---------------------------------------------------------------------
-- Table: workout_sets
-- Purpose: Individual sets/activities performed within a workout
-- Notes:
--   - sort_order maintains the sequence of exercises within a workout
--   - weight/reps columns for strength exercises (nullable for cardio)
--   - distance/time columns for cardio exercises (nullable for strength)
--   - calculated_1rm stores the calculated one-rep max for strength sets
--   - calculated_volume stores weight * reps for quick analytics
--   - Cascades delete when parent workout is deleted
-- ---------------------------------------------------------------------
create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  sort_order integer not null,
  weight numeric(5,2) check (weight >= 0),
  reps integer check (reps > 0),
  distance numeric(8,2) check (distance >= 0),
  time integer check (time >= 0),
  calculated_1rm numeric(6,2),
  calculated_volume numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS for workout_sets table
-- Ensures users can only access sets from their own workouts
alter table workout_sets enable row level security;

-- =====================================================================
-- 4. INDEXES
-- =====================================================================

-- Index for dashboard and workout list queries
-- Supports efficient retrieval of "last X workouts for user"
create index idx_workouts_user_date on workouts (user_id, date desc);

-- Index for workout details queries
-- Enables fast JOIN when fetching all sets for a workout
create index idx_workout_sets_workout_id on workout_sets (workout_id);

-- Index for exercise history and analytics queries
-- Supports filtering all sets for a specific exercise (e.g., "show progress for Bench Press")
create index idx_workout_sets_exercise_id on workout_sets (exercise_id);

-- Index for exercise dictionary filtering
-- Speeds up queries for user-specific and global exercises
create index idx_exercises_user_id on exercises (user_id);

-- =====================================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATED_AT
-- =====================================================================

-- Trigger to automatically update updated_at on exercises table
create trigger handle_exercises_updated_at before update on exercises
  for each row execute procedure moddatetime (updated_at);

-- Trigger to automatically update updated_at on workouts table
create trigger handle_workouts_updated_at before update on workouts
  for each row execute procedure moddatetime (updated_at);

-- Trigger to automatically update updated_at on workout_sets table
create trigger handle_workout_sets_updated_at before update on workout_sets
  for each row execute procedure moddatetime (updated_at);

-- =====================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================================

-- ---------------------------------------------------------------------
-- RLS Policies for: exercises
-- ---------------------------------------------------------------------

-- Policy: Allow authenticated users to view global and their own exercises
-- Rationale: Users need to see system exercises (user_id IS NULL) and their custom exercises
create policy "exercises_select_policy_authenticated"
  on exercises for select
  to authenticated
  using (auth.uid() = user_id or user_id is null);

-- Policy: Allow anonymous users to view global exercises only
-- Rationale: Public access to system exercise dictionary
create policy "exercises_select_policy_anon"
  on exercises for select
  to anon
  using (user_id is null);

-- Policy: Allow authenticated users to insert their own exercises
-- Rationale: Users can create custom exercises but cannot create system exercises
create policy "exercises_insert_policy_authenticated"
  on exercises for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from inserting exercises
-- Rationale: Creating exercises requires authentication
create policy "exercises_insert_policy_anon"
  on exercises for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to update their own exercises
-- Rationale: Users can only modify their custom exercises, not system ones
create policy "exercises_update_policy_authenticated"
  on exercises for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from updating exercises
-- Rationale: Updating exercises requires authentication
create policy "exercises_update_policy_anon"
  on exercises for update
  to anon
  using (false);

-- Policy: Allow authenticated users to delete their own exercises
-- Rationale: Users can delete their custom exercises (soft delete via is_archived recommended)
create policy "exercises_delete_policy_authenticated"
  on exercises for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from deleting exercises
-- Rationale: Deleting exercises requires authentication
create policy "exercises_delete_policy_anon"
  on exercises for delete
  to anon
  using (false);

-- ---------------------------------------------------------------------
-- RLS Policies for: workouts
-- ---------------------------------------------------------------------

-- Policy: Allow authenticated users to view their own workouts
-- Rationale: Users can only access their own workout sessions
create policy "workouts_select_policy_authenticated"
  on workouts for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from viewing workouts
-- Rationale: Workouts are private user data
create policy "workouts_select_policy_anon"
  on workouts for select
  to anon
  using (false);

-- Policy: Allow authenticated users to insert their own workouts
-- Rationale: Users can create workout sessions
create policy "workouts_insert_policy_authenticated"
  on workouts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from inserting workouts
-- Rationale: Creating workouts requires authentication
create policy "workouts_insert_policy_anon"
  on workouts for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to update their own workouts
-- Rationale: Users can modify their workout data (date, notes)
create policy "workouts_update_policy_authenticated"
  on workouts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Prevent anonymous users from updating workouts
-- Rationale: Updating workouts requires authentication
create policy "workouts_update_policy_anon"
  on workouts for update
  to anon
  using (false);

-- Policy: Allow authenticated users to delete their own workouts
-- Rationale: Users can remove their workout sessions
create policy "workouts_delete_policy_authenticated"
  on workouts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Prevent anonymous users from deleting workouts
-- Rationale: Deleting workouts requires authentication
create policy "workouts_delete_policy_anon"
  on workouts for delete
  to anon
  using (false);

-- ---------------------------------------------------------------------
-- RLS Policies for: workout_sets
-- ---------------------------------------------------------------------

-- Policy: Allow authenticated users to view sets from their own workouts
-- Rationale: Users can only see sets belonging to their workouts
create policy "workout_sets_select_policy_authenticated"
  on workout_sets for select
  to authenticated
  using (
    workout_id in (
      select id from workouts where user_id = auth.uid()
    )
  );

-- Policy: Prevent anonymous users from viewing workout sets
-- Rationale: Workout sets are private user data
create policy "workout_sets_select_policy_anon"
  on workout_sets for select
  to anon
  using (false);

-- Policy: Allow authenticated users to insert sets into their own workouts
-- Rationale: Users can add sets to their workouts
create policy "workout_sets_insert_policy_authenticated"
  on workout_sets for insert
  to authenticated
  with check (
    workout_id in (
      select id from workouts where user_id = auth.uid()
    )
  );

-- Policy: Prevent anonymous users from inserting workout sets
-- Rationale: Creating sets requires authentication
create policy "workout_sets_insert_policy_anon"
  on workout_sets for insert
  to anon
  with check (false);

-- Policy: Allow authenticated users to update sets in their own workouts
-- Rationale: Users can modify their workout set data
create policy "workout_sets_update_policy_authenticated"
  on workout_sets for update
  to authenticated
  using (
    workout_id in (
      select id from workouts where user_id = auth.uid()
    )
  )
  with check (
    workout_id in (
      select id from workouts where user_id = auth.uid()
    )
  );

-- Policy: Prevent anonymous users from updating workout sets
-- Rationale: Updating sets requires authentication
create policy "workout_sets_update_policy_anon"
  on workout_sets for update
  to anon
  using (false);

-- Policy: Allow authenticated users to delete sets from their own workouts
-- Rationale: Users can remove sets from their workouts
create policy "workout_sets_delete_policy_authenticated"
  on workout_sets for delete
  to authenticated
  using (
    workout_id in (
      select id from workouts where user_id = auth.uid()
    )
  );

-- Policy: Prevent anonymous users from deleting workout sets
-- Rationale: Deleting sets requires authentication
create policy "workout_sets_delete_policy_anon"
  on workout_sets for delete
  to anon
  using (false);

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
