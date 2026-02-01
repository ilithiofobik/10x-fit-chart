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
  UpdateWorkoutCommand,
  MessageResponse,
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

    return {
      id: workout.id,
      user_id: workout.user_id,
      date: workout.date,
      notes: workout.notes,
      created_at: workout.created_at,
      updated_at: workout.updated_at,
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
 * @throws Error if reps <= 0 or weight < 0
 *
 * @remarks
 * Brzycki formula is most accurate for 1-12 reps.
 * For reps > 36, the formula becomes unreliable (denominator approaches zero).
 * Formula: 1RM = weight / (1.0278 - 0.0278 * reps)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (weight < 0) {
    throw new Error("Weight must be non-negative");
  }
  if (reps <= 0) {
    throw new Error("Reps must be greater than 0");
  }
  if (reps === 1) return weight;

  // Brzycki formula: 1RM = weight / (1.0278 - 0.0278 * reps)
  const result = weight / (1.0278 - 0.0278 * reps);

  // Round to 2 decimal places
  return Math.round(result * 100) / 100;
}

/**
 * Calculate volume (total work done)
 * @param weight - Weight lifted in kg
 * @param reps - Number of repetitions
 * @returns Volume (weight * reps) rounded to 2 decimal places
 * @throws Error if weight < 0 or reps <= 0
 */
export function calculateVolume(weight: number, reps: number): number {
  if (weight < 0) {
    throw new Error("Weight must be non-negative");
  }
  if (reps <= 0) {
    throw new Error("Reps must be greater than 0");
  }

  const result = weight * reps;

  // Round to 2 decimal places
  return Math.round(result * 100) / 100;
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
    const exercise = exerciseMap.get(set.exercise_id);
    if (!exercise) {
      throw new Error(`Exercise ${set.exercise_id} not found`);
    }

    const setData: {
      workout_id: string;
      exercise_id: string;
      sort_order: number;
      weight: number | null;
      reps: number | null;
      distance: number | null;
      time: number | null;
      calculated_1rm: number | null;
      calculated_volume: number | null;
    } = {
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
    const exercise = exerciseMap.get(set.exercise_id);
    if (!exercise) {
      throw new Error(`Exercise ${set.exercise_id} not found`);
    }
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
  const sets: WorkoutSetDTO[] = (workout.workout_sets || []).map(
    (set: { exercises: { name: string; type: ExerciseType }; [key: string]: unknown }) => {
      const exercise = set.exercises;
      const setData = { ...set };
      delete setData.exercises;

      return {
        id: setData.id,
        workout_id: setData.workout_id,
        exercise_id: setData.exercise_id,
        exercise_name: exercise.name,
        exercise_type: exercise.type as ExerciseType,
        sort_order: setData.sort_order,
        weight: setData.weight as number | null,
        reps: setData.reps as number | null,
        distance: setData.distance as number | null,
        time: setData.time as number | null,
        calculated_1rm: setData.calculated_1rm as number | null,
        calculated_volume: setData.calculated_volume as number | null,
        created_at: setData.created_at as string,
        updated_at: setData.updated_at as string,
      } as WorkoutSetDTO;
    }
  );

  // Sort sets by sort_order to ensure correct display order
  sets.sort((a, b) => a.sort_order - b.sort_order);

  // Return WorkoutDetailsDTO
  return {
    id: workout.id,
    user_id: workout.user_id,
    date: workout.date,
    notes: workout.notes,
    created_at: workout.created_at,
    updated_at: workout.updated_at,
    sets,
  };
}

/**
 * Get workout details by ID
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @param workoutId - Workout ID to retrieve
 * @returns WorkoutDetailsDTO or null if not found
 */
export async function getWorkoutById(
  supabase: SupabaseClient,
  userId: string,
  workoutId: string
): Promise<WorkoutDetailsDTO | null> {
  // Query workout with sets and exercises using nested select
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
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching workout:", error);
    throw new Error("Failed to fetch workout");
  }

  if (!workout) {
    return null;
  }

  // Map workout_sets to WorkoutSetDTO with exercise info
  const sets: WorkoutSetDTO[] = (workout.workout_sets || []).map(
    (set: { exercises: { name: string; type: ExerciseType }; [key: string]: unknown }) => {
      const exercise = set.exercises;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { exercises: _exercises, ...setData } = set;

      return {
        ...setData,
        exercise_name: exercise.name,
        exercise_type: exercise.type as ExerciseType,
      } as WorkoutSetDTO;
    }
  );

  // Sort sets by sort_order
  sets.sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: workout.id,
    user_id: workout.user_id,
    date: workout.date,
    notes: workout.notes,
    created_at: workout.created_at,
    updated_at: workout.updated_at,
    sets,
  };
}

/**
 * Update an existing workout
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @param workoutId - Workout ID to update
 * @param command - Update data with sets
 * @returns Updated WorkoutDetailsDTO
 */
export async function updateWorkout(
  supabase: SupabaseClient,
  userId: string,
  workoutId: string,
  command: UpdateWorkoutCommand
): Promise<WorkoutDetailsDTO> {
  const { date, notes, sets } = command;

  // Verify workout exists and belongs to user
  const { data: existingWorkout, error: workoutCheckError } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (workoutCheckError) {
    console.error("Error checking workout:", workoutCheckError);
    throw new Error("Failed to verify workout ownership");
  }

  if (!existingWorkout) {
    throw new Error("Workout not found or does not belong to user");
  }

  // Extract unique exercise IDs for validation
  const exerciseIds = [...new Set(sets.map((set) => set.exercise_id))];

  // Validate exercises exist and are accessible
  const { data: exercises, error: exerciseError } = await supabase.from("exercises").select("*").in("id", exerciseIds);

  if (exerciseError) {
    console.error("Error fetching exercises:", exerciseError);
    throw new Error("Failed to validate exercises");
  }

  if (!exercises || exercises.length !== exerciseIds.length) {
    throw new ExerciseNotFoundError("One or more exercises not found or not accessible");
  }

  // Create exercise map
  const exerciseMap = new Map<string, Exercise>(exercises.map((ex) => [ex.id, ex]));

  // Validate exercise types match provided fields
  for (const set of sets) {
    const exercise = exerciseMap.get(set.exercise_id);
    if (!exercise) {
      throw new ExerciseNotFoundError(`Exercise ${set.exercise_id} not found`);
    }

    if (exercise.type === "strength") {
      if (set.distance !== null && set.distance !== undefined) {
        throw new ExerciseTypeMismatchError(`Strength exercise "${exercise.name}" cannot have distance field`);
      }
      if (set.time !== null && set.time !== undefined) {
        throw new ExerciseTypeMismatchError(`Strength exercise "${exercise.name}" cannot have time field`);
      }
    } else {
      if (set.weight !== null && set.weight !== undefined) {
        throw new ExerciseTypeMismatchError(`Cardio exercise "${exercise.name}" cannot have weight field`);
      }
      if (set.reps !== null && set.reps !== undefined) {
        throw new ExerciseTypeMismatchError(`Cardio exercise "${exercise.name}" cannot have reps field`);
      }
    }
  }

  // Update workout metadata if provided
  if (date !== undefined || notes !== undefined) {
    const updateData: {
      date?: string;
      notes?: string | null;
    } = {};
    if (date !== undefined) updateData.date = date;
    if (notes !== undefined) updateData.notes = notes;

    const { error: updateError } = await supabase.from("workouts").update(updateData).eq("id", workoutId);

    if (updateError) {
      console.error("Error updating workout:", updateError);
      throw new Error("Failed to update workout");
    }
  }

  // Delete all existing sets for this workout
  const { error: deleteError } = await supabase.from("workout_sets").delete().eq("workout_id", workoutId);

  if (deleteError) {
    console.error("Error deleting workout sets:", deleteError);
    throw new Error("Failed to delete old workout sets");
  }

  // Prepare new workout sets with calculated fields
  const workoutSets = sets.map((set) => {
    const exercise = exerciseMap.get(set.exercise_id);
    if (!exercise) {
      throw new Error(`Exercise ${set.exercise_id} not found`);
    }

    const setData: {
      workout_id: string;
      exercise_id: string;
      sort_order: number;
      weight: number | null;
      reps: number | null;
      distance: number | null;
      time: number | null;
      calculated_1rm: number | null;
      calculated_volume: number | null;
    } = {
      workout_id: workoutId,
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

  // Insert new workout sets
  const { data: createdSets, error: setsError } = await supabase.from("workout_sets").insert(workoutSets).select();

  if (setsError) {
    console.error("Error creating workout sets:", setsError);
    throw new Error("Failed to create workout sets");
  }

  if (!createdSets) {
    throw new Error("Failed to retrieve created workout sets");
  }

  // Fetch updated workout
  const updatedWorkout = await getWorkoutById(supabase, userId, workoutId);

  if (!updatedWorkout) {
    throw new Error("Failed to retrieve updated workout");
  }

  return updatedWorkout;
}

/**
 * Delete a workout and all its sets
 * @param supabase - Supabase client instance
 * @param userId - Current user ID from auth
 * @param workoutId - Workout ID to delete
 * @returns Success message
 */
export async function deleteWorkout(
  supabase: SupabaseClient,
  userId: string,
  workoutId: string
): Promise<MessageResponse> {
  // Verify workout exists and belongs to user
  const { data: existingWorkout, error: workoutCheckError } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", workoutId)
    .eq("user_id", userId)
    .maybeSingle();

  if (workoutCheckError) {
    console.error("Error checking workout:", workoutCheckError);
    throw new Error("Failed to verify workout ownership");
  }

  if (!existingWorkout) {
    throw new Error("Workout not found or does not belong to user");
  }

  // Delete workout (cascade will delete workout_sets)
  const { error: deleteError } = await supabase.from("workouts").delete().eq("id", workoutId).eq("user_id", userId);

  if (deleteError) {
    console.error("Error deleting workout:", deleteError);
    throw new Error("Failed to delete workout");
  }

  return {
    message: "Workout deleted successfully",
  };
}
