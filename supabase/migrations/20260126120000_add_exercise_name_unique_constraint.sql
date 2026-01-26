-- =====================================================================
-- Migration: Add Unique Constraint on Exercise Names
-- Purpose: Prevent duplicate exercise names per user and optimize lookups
-- Date: 2026-01-26
-- 
-- This migration adds:
-- - UNIQUE constraint on (user_id, name) to prevent race conditions
-- - Index to optimize uniqueness checks for exercise creation
-- =====================================================================

-- =====================================================================
-- 1. ADD UNIQUE CONSTRAINT
-- =====================================================================

-- Add unique constraint on (user_id, name) combination
-- This ensures that a user cannot have two exercises with the same name
-- System exercises (user_id IS NULL) can have the same names as user exercises
-- Note: This constraint also creates an implicit index
ALTER TABLE exercises 
ADD CONSTRAINT exercises_user_name_unique 
UNIQUE (user_id, name);

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
