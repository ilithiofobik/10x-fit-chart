-- =====================================================================
-- Migration: Seed System Exercises
-- Purpose: Populate exercises table with default global exercises
-- Date: 2026-01-16
-- 
-- This migration adds:
-- - Common strength training exercises (compound and isolation)
-- - Common cardio activities
-- 
-- Notes:
-- - user_id is NULL for all exercises (system-wide/global)
-- - These exercises are visible to all users
-- - Users cannot modify or delete these exercises (RLS enforced)
-- =====================================================================

-- =====================================================================
-- STRENGTH EXERCISES
-- =====================================================================

-- Insert common compound strength exercises
insert into exercises (user_id, name, type, is_archived) values
  -- Major Compound Movements
  (null, 'Barbell Bench Press', 'strength', false),
  (null, 'Barbell Back Squat', 'strength', false),
  (null, 'Conventional Deadlift', 'strength', false),
  (null, 'Barbell Overhead Press', 'strength', false),
  (null, 'Barbell Row', 'strength', false),
  
  -- Squat Variations
  (null, 'Front Squat', 'strength', false),
  (null, 'Goblet Squat', 'strength', false),
  (null, 'Bulgarian Split Squat', 'strength', false),
  (null, 'Leg Press', 'strength', false),
  
  -- Deadlift Variations
  (null, 'Romanian Deadlift', 'strength', false),
  (null, 'Sumo Deadlift', 'strength', false),
  (null, 'Trap Bar Deadlift', 'strength', false),
  
  -- Pressing Movements
  (null, 'Incline Barbell Bench Press', 'strength', false),
  (null, 'Decline Barbell Bench Press', 'strength', false),
  (null, 'Dumbbell Bench Press', 'strength', false),
  (null, 'Dumbbell Incline Press', 'strength', false),
  (null, 'Dumbbell Overhead Press', 'strength', false),
  (null, 'Push-ups', 'strength', false),
  (null, 'Dips', 'strength', false),
  
  -- Pulling Movements
  (null, 'Pull-ups', 'strength', false),
  (null, 'Chin-ups', 'strength', false),
  (null, 'Lat Pulldown', 'strength', false),
  (null, 'Cable Row', 'strength', false),
  (null, 'Dumbbell Row', 'strength', false),
  (null, 'T-Bar Row', 'strength', false),
  (null, 'Face Pulls', 'strength', false),
  
  -- Leg Exercises
  (null, 'Leg Extension', 'strength', false),
  (null, 'Leg Curl', 'strength', false),
  (null, 'Walking Lunges', 'strength', false),
  (null, 'Calf Raise', 'strength', false),
  (null, 'Seated Calf Raise', 'strength', false),
  
  -- Arm Exercises
  (null, 'Barbell Curl', 'strength', false),
  (null, 'Dumbbell Curl', 'strength', false),
  (null, 'Hammer Curl', 'strength', false),
  (null, 'Tricep Dips', 'strength', false),
  (null, 'Tricep Pushdown', 'strength', false),
  (null, 'Overhead Tricep Extension', 'strength', false),
  (null, 'Skull Crushers', 'strength', false),
  
  -- Shoulder Exercises
  (null, 'Lateral Raise', 'strength', false),
  (null, 'Front Raise', 'strength', false),
  (null, 'Rear Delt Fly', 'strength', false),
  (null, 'Shrugs', 'strength', false),
  
  -- Core Exercises
  (null, 'Plank', 'strength', false),
  (null, 'Side Plank', 'strength', false),
  (null, 'Ab Wheel Rollout', 'strength', false),
  (null, 'Cable Crunch', 'strength', false),
  (null, 'Hanging Leg Raise', 'strength', false);

-- =====================================================================
-- CARDIO EXERCISES
-- =====================================================================

-- Insert common cardio activities
insert into exercises (user_id, name, type, is_archived) values
  -- Running
  (null, 'Outdoor Running', 'cardio', false),
  (null, 'Treadmill Running', 'cardio', false),
  (null, 'Interval Running', 'cardio', false),
  (null, 'Sprint Training', 'cardio', false),
  
  -- Cycling
  (null, 'Outdoor Cycling', 'cardio', false),
  (null, 'Stationary Bike', 'cardio', false),
  (null, 'Spin Class', 'cardio', false),
  
  -- Swimming
  (null, 'Swimming', 'cardio', false),
  (null, 'Swimming - Freestyle', 'cardio', false),
  (null, 'Swimming - Breaststroke', 'cardio', false),
  
  -- Rowing
  (null, 'Rowing Machine', 'cardio', false),
  (null, 'Outdoor Rowing', 'cardio', false),
  
  -- Other Cardio
  (null, 'Elliptical', 'cardio', false),
  (null, 'Stair Climber', 'cardio', false),
  (null, 'Jump Rope', 'cardio', false),
  (null, 'Burpees', 'cardio', false),
  (null, 'Mountain Climbers', 'cardio', false),
  (null, 'Box Jumps', 'cardio', false),
  (null, 'Jumping Jacks', 'cardio', false),
  
  -- Walking
  (null, 'Walking', 'cardio', false),
  (null, 'Hiking', 'cardio', false),
  (null, 'Incline Walking', 'cardio', false);

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
