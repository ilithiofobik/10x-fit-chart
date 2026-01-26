/**
 * Exercise Service
 * Handles business logic for exercise operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { ExerciseDTO, ExerciseType, CreateExerciseCommand } from "../../types";

/**
 * Custom error for duplicate exercise name
 */
export class ExerciseConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExerciseConflictError";
  }
}

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

/**
 * Create a new exercise for the user
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @param command - Exercise creation data
 * @returns Created ExerciseDTO with is_system = false
 * @throws ExerciseConflictError if exercise name already exists for user
 */
export async function createExercise(
  supabase: SupabaseClient,
  userId: string,
  command: CreateExerciseCommand
): Promise<ExerciseDTO> {
  const { name, type } = command;

  // Check if exercise with this name already exists for the user
  const { data: existingExercises, error: checkError } = await supabase
    .from("exercises")
    .select("id")
    .eq("user_id", userId)
    .eq("name", name)
    .limit(1);

  if (checkError) {
    console.error("Error checking exercise uniqueness:", checkError);
    throw new Error("Failed to check exercise uniqueness");
  }

  // If exercise with this name already exists, throw conflict error
  if (existingExercises && existingExercises.length > 0) {
    throw new ExerciseConflictError("Exercise with this name already exists");
  }

  // Insert new exercise
  const { data: newExercise, error: insertError } = await supabase
    .from("exercises")
    .insert({
      user_id: userId,
      name: name,
      type: type,
      is_archived: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating exercise:", insertError);
    throw new Error("Failed to create exercise");
  }

  if (!newExercise) {
    throw new Error("Failed to retrieve created exercise");
  }

  // Map to ExerciseDTO with is_system = false (user exercises are never system)
  const exerciseDTO: ExerciseDTO = {
    ...newExercise,
    is_system: false,
  };

  return exerciseDTO;
}
