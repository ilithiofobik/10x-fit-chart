/**
 * Workout Service
 * Handles business logic for workout operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { WorkoutListItemDTO, ListWorkoutsResponse, PaginationDTO } from "../../types";

export interface ListWorkoutsFilters {
  limit: number;
  offset: number;
  startDate?: string;
  endDate?: string;
  order: "asc" | "desc";
}

/**
 * List workouts for the user with pagination and aggregated counts
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @param filters - Pagination and date filters
 * @returns ListWorkoutsResponse with workouts and pagination metadata
 */
export async function listWorkouts(
  supabase: SupabaseClient,
  userId: string,
  filters: ListWorkoutsFilters
): Promise<ListWorkoutsResponse> {
  const { limit, offset, startDate, endDate, order } = filters;

  // Build base query for workouts
  let countQuery = supabase.from("workouts").select("*", { count: "exact", head: true }).eq("user_id", userId);

  let dataQuery = supabase
    .from("workouts")
    .select(
      `
      *,
      workout_sets (
        id,
        exercise_id
      )
    `
    )
    .eq("user_id", userId);

  // Apply date filters
  if (startDate) {
    countQuery = countQuery.gte("date", startDate);
    dataQuery = dataQuery.gte("date", startDate);
  }

  if (endDate) {
    countQuery = countQuery.lte("date", endDate);
    dataQuery = dataQuery.lte("date", endDate);
  }

  // Apply ordering
  dataQuery = dataQuery.order("date", { ascending: order === "asc" });

  // Apply pagination
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute both queries
  const [{ count, error: countError }, { data: workouts, error: dataError }] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  if (countError) {
    console.error("Error counting workouts:", countError);
    throw new Error("Failed to count workouts");
  }

  if (dataError) {
    console.error("Error fetching workouts:", dataError);
    throw new Error("Failed to fetch workouts");
  }

  const total = count || 0;

  if (!workouts) {
    const pagination: PaginationDTO = {
      total,
      limit,
      offset,
      has_more: false,
    };

    return {
      workouts: [],
      pagination,
    };
  }

  // Map workouts to WorkoutListItemDTO with aggregated counts
  const workoutListItems: WorkoutListItemDTO[] = workouts.map((workout) => {
    const sets = workout.workout_sets || [];

    // Count unique exercises
    const uniqueExercises = new Set(sets.map((set) => set.exercise_id));
    const exercise_count = uniqueExercises.size;

    // Count total sets
    const set_count = sets.length;

    // Remove workout_sets from the response
    const { workout_sets, ...workoutData } = workout;

    return {
      ...workoutData,
      exercise_count,
      set_count,
    };
  });

  // Calculate pagination metadata
  const pagination: PaginationDTO = {
    total,
    limit,
    offset,
    has_more: offset + limit < total,
  };

  return {
    workouts: workoutListItems,
    pagination,
  };
}
