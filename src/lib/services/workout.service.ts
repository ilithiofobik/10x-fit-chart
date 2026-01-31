/**
 * Workout Service
 * Handles business logic for workout operations
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  WorkoutListItemDTO,
  ListWorkoutsResponse,
  PaginationDTO,
  CreateWorkoutCommand,
  WorkoutDetailsDTO,
  WorkoutSetDTO,
  Exercise,
  ExerciseType,
} from "../../types";

/**
 * Custom error for exercise not found
 */
export class ExerciseNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExerciseNotFoundError";
  }
}

/**
 * Custom error for exercise type mismatch
 */
export class ExerciseTypeMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExerciseTypeMismatchError";
  }
}

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

/**
 * Calculate 1RM (One Rep Max) using Brzycki formula
 * @param weight - Weight lifted in kg
 * @param reps - Number of repetitions
 * @returns Calculated 1RM value
 */
function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  // Brzycki formula: 1RM = weight / (1.0278 - 0.0278 * reps)
  return weight / (1.0278 - 0.0278 * reps);
}

/**
 * Calculate volume (total work done)
 * @param weight - Weight lifted in kg
 * @param reps - Number of repetitions
 * @returns Volume (weight * reps)
 */
function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

/**
 * Create a new workout with sets
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @param command - Workout creation data with sets
 * @returns Created WorkoutDetailsDTO with all sets and exercise info
 */
export async function createWorkout(
  supabase: SupabaseClient,
  userId: string,
  command: CreateWorkoutCommand
): Promise<WorkoutDetailsDTO> {
  const { date, notes, sets } = command;

  // Extract unique exercise IDs for validation
  const exerciseIds = [...new Set(sets.map((set) => set.exercise_id))];

  // Validate exercises exist and are accessible (system or user's)
  const { data: exercises, error: exerciseError } = await supabase.from("exercises").select("*").in("id", exerciseIds);

  if (exerciseError) {
    console.error("Error fetching exercises:", exerciseError);
    throw new Error("Failed to validate exercises");
  }

  if (!exercises || exercises.length !== exerciseIds.length) {
    throw new ExerciseNotFoundError("One or more exercises not found or not accessible");
  }

  // Create exercise map for quick lookup
  const exerciseMap = new Map<string, Exercise>(exercises.map((ex) => [ex.id, ex]));

  // Validate exercise types match the provided fields
  for (const set of sets) {
    const exercise = exerciseMap.get(set.exercise_id);
    if (!exercise) {
      throw new ExerciseNotFoundError(`Exercise ${set.exercise_id} not found`);
    }

    if (exercise.type === "strength") {
      // Strength exercises should have weight/reps, not distance/time
      if (set.distance !== null && set.distance !== undefined) {
        throw new ExerciseTypeMismatchError(`Strength exercise "${exercise.name}" cannot have distance field`);
      }
      if (set.time !== null && set.time !== undefined) {
        throw new ExerciseTypeMismatchError(`Strength exercise "${exercise.name}" cannot have time field`);
      }
    } else {
      // Cardio exercises should have distance/time, not weight/reps
      if (set.weight !== null && set.weight !== undefined) {
        throw new ExerciseTypeMismatchError(`Cardio exercise "${exercise.name}" cannot have weight field`);
      }
      if (set.reps !== null && set.reps !== undefined) {
        throw new ExerciseTypeMismatchError(`Cardio exercise "${exercise.name}" cannot have reps field`);
      }
    }
  }

  // Create workout
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      date,
      notes: notes || null,
    })
    .select()
    .single();

  if (workoutError) {
    console.error("Error creating workout:", workoutError);
    throw new Error("Failed to create workout");
  }

  if (!workout) {
    throw new Error("Failed to retrieve created workout");
  }

  // Prepare workout sets with calculated fields
  const workoutSets = sets.map((set) => {
    const exercise = exerciseMap.get(set.exercise_id)!;
    const setData: any = {
      workout_id: workout.id,
      exercise_id: set.exercise_id,
      sort_order: set.sort_order,
      weight: set.weight ?? null,
      reps: set.reps ?? null,
      distance: set.distance ?? null,
      time: set.time ?? null,
      calculated_1rm: null,
      calculated_volume: null,
    };

    // Calculate 1RM and volume for strength exercises
    if (exercise.type === "strength" && set.weight && set.reps) {
      setData.calculated_1rm = calculate1RM(set.weight, set.reps);
      setData.calculated_volume = calculateVolume(set.weight, set.reps);
    }

    return setData;
  });

  // Insert all workout sets
  const { data: createdSets, error: setsError } = await supabase.from("workout_sets").insert(workoutSets).select();

  if (setsError) {
    console.error("Error creating workout sets:", setsError);
    // Try to rollback by deleting the workout
    await supabase.from("workouts").delete().eq("id", workout.id);
    throw new Error("Failed to create workout sets");
  }

  if (!createdSets) {
    // Rollback workout
    await supabase.from("workouts").delete().eq("id", workout.id);
    throw new Error("Failed to retrieve created workout sets");
  }

  // Map sets to WorkoutSetDTO with exercise information
  const setsDTO: WorkoutSetDTO[] = createdSets.map((set) => {
    const exercise = exerciseMap.get(set.exercise_id)!;
    return {
      ...set,
      exercise_name: exercise.name,
      exercise_type: exercise.type,
    };
  });

  // Return WorkoutDetailsDTO
  const workoutDetails: WorkoutDetailsDTO = {
    ...workout,
    sets: setsDTO,
  };

  return workoutDetails;
}

/**
 * Get user's latest workout with all sets and exercise info
 * Returns the most recent workout by date (and created_at for same-day tie-breaking)
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @returns WorkoutDetailsDTO or null if no workouts exist
 */
export async function getLatestWorkout(supabase: SupabaseClient, userId: string): Promise<WorkoutDetailsDTO | null> {
  // Query latest workout with sets and exercises using nested select
  const { data: workout, error } = await supabase
    .from("workouts")
    .select(
      `
      *,
      workout_sets (
        *,
        exercises (
          name,
          type
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle() to allow null result without error

  if (error) {
    console.error("Error fetching latest workout:", error);
    throw new Error("Failed to fetch latest workout");
  }

  // If no workout exists (new user or no workouts yet)
  if (!workout) {
    return null;
  }

  // Map workout_sets to WorkoutSetDTO with exercise info
  const sets: WorkoutSetDTO[] = (workout.workout_sets || []).map((set: any) => {
    const exercise = set.exercises;

    // Create WorkoutSetDTO without the nested exercises object
    const { exercises: _, ...setData } = set;

    return {
      ...setData,
      exercise_name: exercise.name,
      exercise_type: exercise.type as ExerciseType,
    };
  });

  // Sort sets by sort_order to ensure correct display order
  sets.sort((a, b) => a.sort_order - b.sort_order);

  // Remove workout_sets from workout object to avoid duplication
  const { workout_sets, ...workoutData } = workout;

  // Return WorkoutDetailsDTO
  return {
    ...workoutData,
    sets,
  };
}
