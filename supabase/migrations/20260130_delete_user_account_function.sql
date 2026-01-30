-- Migration: Add function for secure user account deletion
-- Date: 2026-01-30
-- Purpose: Implements US-003 (Trwałe usuwanie konta użytkownika)
--
-- This function safely deletes a user account and all associated data.
-- It uses SECURITY DEFINER to execute with elevated privileges,
-- allowing deletion from auth.users table.

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS delete_user_account();

-- Create the function
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_user_id uuid;
  deleted_workouts_count integer;
  deleted_exercises_count integer;
BEGIN
  -- Get the current user ID from the session
  deleted_user_id := auth.uid();
  
  -- Safety check: ensure user is authenticated
  IF deleted_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Delete all workouts (will cascade delete workout_sets via foreign key)
  DELETE FROM workouts 
  WHERE user_id = deleted_user_id;
  
  GET DIAGNOSTICS deleted_workouts_count = ROW_COUNT;

  -- 2. Delete all custom exercises (user-created exercises)
  DELETE FROM exercises 
  WHERE user_id = deleted_user_id;
  
  GET DIAGNOSTICS deleted_exercises_count = ROW_COUNT;

  -- 3. Delete user from auth.users
  -- This requires SECURITY DEFINER privilege
  DELETE FROM auth.users 
  WHERE id = deleted_user_id;

  -- 4. Return success info
  RETURN jsonb_build_object(
    'success', true,
    'user_id', deleted_user_id,
    'deleted_workouts', deleted_workouts_count,
    'deleted_exercises', deleted_exercises_count,
    'message', 'User account deleted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE WARNING 'Error deleting user account: %', SQLERRM;
    RAISE EXCEPTION 'Failed to delete user account: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION delete_user_account() IS 
'Safely deletes the current user account and all associated data (workouts, exercises). 
Requires authentication. Uses SECURITY DEFINER to delete from auth.users table.';
