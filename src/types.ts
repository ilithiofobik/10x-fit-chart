/**
 * 10xFitChart - DTO and Command Model Type Definitions
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used for communication between the client and API endpoints.
 * All types are derived from database entity definitions.
 */

import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// BASE ENTITY TYPES
// ============================================================================

/**
 * Exercise entity from database
 */
export type Exercise = Tables<"exercises">;

/**
 * Workout entity from database
 */
export type Workout = Tables<"workouts">;

/**
 * Workout Set entity from database
 */
export type WorkoutSet = Tables<"workout_sets">;

/**
 * Exercise type enum
 */
export type ExerciseType = Enums<"exercise_type">;

// ============================================================================
// COMMON DTOs
// ============================================================================

/**
 * Generic message response for simple operations
 */
export interface MessageResponse {
  message: string;
}

/**
 * Pagination metadata for list endpoints
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================================================
// EXERCISE DTOs
// ============================================================================

/**
 * Exercise DTO with computed is_system field
 * Used in: GET /api/exercises, POST /api/exercises, PUT /api/exercises/:id
 */
export type ExerciseDTO = Exercise & {
  is_system: boolean;
};

/**
 * Command to create a new exercise
 * Used in: POST /api/exercises
 */
export interface CreateExerciseCommand {
  name: string;
  type: ExerciseType;
}

/**
 * Command to update an existing exercise
 * Used in: PUT /api/exercises/:id
 */
export interface UpdateExerciseCommand {
  name: string;
}

/**
 * Response when archiving an exercise
 * Used in: DELETE /api/exercises/:id
 */
export interface ArchiveExerciseResponse {
  id: string;
  is_archived: boolean;
  message: string;
}

/**
 * Response for exercise list endpoint
 * Used in: GET /api/exercises
 */
export interface ListExercisesResponse {
  exercises: ExerciseDTO[];
}

// ============================================================================
// WORKOUT DTOs
// ============================================================================

/**
 * Workout list item with aggregated counts
 * Used in: GET /api/workouts
 */
export type WorkoutListItemDTO = Workout & {
  exercise_count: number;
  set_count: number;
};

/**
 * Response for workout list endpoint
 * Used in: GET /api/workouts
 */
export interface ListWorkoutsResponse {
  workouts: WorkoutListItemDTO[];
  pagination: PaginationDTO;
}

/**
 * Workout set with extended exercise information
 * Used in workout details and creation responses
 */
export type WorkoutSetDTO = WorkoutSet & {
  exercise_name: string;
  exercise_type: ExerciseType;
};

/**
 * Detailed workout with all sets
 * Used in: GET /api/workouts/:id, GET /api/workouts/latest
 */
export type WorkoutDetailsDTO = Workout & {
  sets: WorkoutSetDTO[];
};

/**
 * Set data for creating a workout (minimal required fields)
 * Used in: POST /api/workouts
 */
export interface CreateWorkoutSetCommand {
  exercise_id: string;
  sort_order: number;
  // Strength exercise fields (mutually exclusive with cardio fields)
  weight?: number | null;
  reps?: number | null;
  // Cardio exercise fields (mutually exclusive with strength fields)
  distance?: number | null;
  time?: number | null;
}

/**
 * Command to create a new workout with sets
 * Used in: POST /api/workouts
 */
export interface CreateWorkoutCommand {
  date: string;
  notes?: string | null;
  sets: CreateWorkoutSetCommand[];
}

/**
 * Set data for updating a workout (includes optional id for existing sets)
 * Used in: PUT /api/workouts/:id
 */
export interface UpdateWorkoutSetCommand {
  id?: string; // If present, updates existing set; if absent, creates new set
  exercise_id: string;
  sort_order: number;
  // Strength exercise fields
  weight?: number | null;
  reps?: number | null;
  // Cardio exercise fields
  distance?: number | null;
  time?: number | null;
}

/**
 * Command to update an existing workout
 * Used in: PUT /api/workouts/:id
 */
export interface UpdateWorkoutCommand {
  date?: string;
  notes?: string | null;
  sets: UpdateWorkoutSetCommand[];
}

/**
 * Set data in workout template (includes exercise metadata)
 * Used in: POST /api/workouts/:id/copy
 */
export interface WorkoutTemplateSetDTO {
  exercise_id: string;
  exercise_name: string;
  exercise_type: ExerciseType;
  sort_order: number;
  // Previous values for reference
  weight?: number | null;
  reps?: number | null;
  distance?: number | null;
  time?: number | null;
}

/**
 * Workout template structure for copying
 * Used in: POST /api/workouts/:id/copy
 */
export interface WorkoutTemplateDTO {
  date: string;
  notes: string;
  sets: WorkoutTemplateSetDTO[];
}

/**
 * Response for workout template copy
 * Used in: POST /api/workouts/:id/copy
 */
export interface CopyWorkoutTemplateResponse {
  template: WorkoutTemplateDTO;
}

// ============================================================================
// WORKOUT SET DTOs (Standalone Operations)
// ============================================================================

/**
 * Command to create a standalone workout set
 * Used in: POST /api/workout-sets
 */
export interface CreateWorkoutSetStandaloneCommand {
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  // Strength exercise fields
  weight?: number | null;
  reps?: number | null;
  // Cardio exercise fields
  distance?: number | null;
  time?: number | null;
}

/**
 * Command to update a standalone workout set
 * Used in: PUT /api/workout-sets/:id
 */
export interface UpdateWorkoutSetStandaloneCommand {
  // All fields are optional for partial updates
  sort_order?: number;
  weight?: number | null;
  reps?: number | null;
  distance?: number | null;
  time?: number | null;
}

// ============================================================================
// ANALYTICS DTOs
// ============================================================================

/**
 * Time period metadata
 * Used in: GET /api/analytics/dashboard
 */
export interface PeriodDTO {
  start_date: string;
  end_date: string;
  months: number;
}

/**
 * Summary statistics
 * Used in: GET /api/analytics/dashboard
 */
export interface SummaryStatsDTO {
  total_workouts: number;
  total_sets: number;
  total_volume: number;
  unique_exercises: number;
}

/**
 * Recent workout summary item
 * Used in: GET /api/analytics/dashboard
 */
export interface RecentWorkoutDTO {
  id: string;
  date: string;
  exercise_count: number;
  set_count: number;
}

/**
 * Dashboard summary response
 * Used in: GET /api/analytics/dashboard
 */
export interface DashboardSummaryDTO {
  period: PeriodDTO;
  summary: SummaryStatsDTO;
  recent_workouts: RecentWorkoutDTO[];
}

/**
 * Exercise information in progress response
 * Used in: GET /api/analytics/exercises/:exercise_id/progress
 */
export interface ExerciseInfoDTO {
  id: string;
  name: string;
  type: ExerciseType;
}

/**
 * Strength exercise details in progress data point
 */
export interface StrengthDetailsDTO {
  weight: number;
  reps: number;
}

/**
 * Cardio exercise details in progress data point
 */
export interface CardioDetailsDTO {
  distance: number;
  time: number;
}

/**
 * Progress data point for exercise tracking
 * Used in: GET /api/analytics/exercises/:exercise_id/progress
 */
export interface ProgressDataPointDTO {
  date: string;
  workout_id: string;
  value: number;
  details: StrengthDetailsDTO | CardioDetailsDTO;
}

/**
 * Metric types for progress tracking
 */
export type ProgressMetric = "max_weight" | "1rm" | "volume" | "avg_speed" | "distance";

/**
 * Exercise progress response
 * Used in: GET /api/analytics/exercises/:exercise_id/progress
 */
export interface ExerciseProgressDTO {
  exercise: ExerciseInfoDTO;
  metric: ProgressMetric;
  data_points: ProgressDataPointDTO[];
}

/**
 * Personal record for strength exercise
 */
export interface StrengthRecordDTO {
  exercise_id: string;
  exercise_name: string;
  exercise_type: "strength";
  max_weight: number;
  max_1rm: number;
  max_volume: number;
  achieved_date: string;
  workout_id: string;
}

/**
 * Personal record for cardio exercise
 */
export interface CardioRecordDTO {
  exercise_id: string;
  exercise_name: string;
  exercise_type: "cardio";
  max_distance: number;
  best_speed: number;
  achieved_date: string;
  workout_id: string;
}

/**
 * Union type for personal records (supports both exercise types)
 */
export type PersonalRecordDTO = StrengthRecordDTO | CardioRecordDTO;

/**
 * Personal records response
 * Used in: GET /api/analytics/personal-records
 */
export interface PersonalRecordsDTO {
  records: PersonalRecordDTO[];
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a record is for a strength exercise
 */
export function isStrengthRecord(record: PersonalRecordDTO): record is StrengthRecordDTO {
  return record.exercise_type === "strength";
}

/**
 * Type guard to check if a record is for a cardio exercise
 */
export function isCardioRecord(record: PersonalRecordDTO): record is CardioRecordDTO {
  return record.exercise_type === "cardio";
}

/**
 * Type guard to check if details are for a strength exercise
 */
export function isStrengthDetails(details: StrengthDetailsDTO | CardioDetailsDTO): details is StrengthDetailsDTO {
  return "weight" in details && "reps" in details;
}

/**
 * Type guard to check if details are for a cardio exercise
 */
export function isCardioDetails(details: StrengthDetailsDTO | CardioDetailsDTO): details is CardioDetailsDTO {
  return "distance" in details && "time" in details;
}
