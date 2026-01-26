/**
 * Exercise Service
 * Handles business logic for exercise operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { ExerciseDTO, ExerciseType } from "../../types";

export interface ListExercisesFilters {
  type?: ExerciseType;
  includeArchived?: boolean;
}

/**
 * List exercises available to the user (system + own exercises)
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @param filters - Optional filters for type and archived status
 * @returns Array of ExerciseDTO with computed is_system field
 */
export async function listExercises(
  supabase: SupabaseClient,
  userId: string,
  filters: ListExercisesFilters = {}
): Promise<ExerciseDTO[]> {
  const { type, includeArchived = false } = filters;

  // Build query with filters
  let query = supabase
    .from("exercises")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${userId}`);

  // Apply type filter if provided
  if (type) {
    query = query.eq("type", type);
  }

  // Apply archived filter (default: exclude archived)
  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  // Execute query
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching exercises:", error);
    throw new Error("Failed to fetch exercises from database");
  }

  if (!data) {
    return [];
  }

  // Map to ExerciseDTO with computed is_system field
  const exerciseDTOs: ExerciseDTO[] = data.map((exercise) => ({
    ...exercise,
    is_system: exercise.user_id === null,
  }));

  return exerciseDTOs;
}
