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

// ============================================================================
// HISTORY VIEW TYPES (Training History)
// ============================================================================

/**
 * Filters for workout history list
 */
export interface HistoryFilters {
  start_date?: string | null;
  end_date?: string | null;
  exercise_id?: string | null;
}

/**
 * State for workout history list
 */
export interface HistoryListState {
  workouts: WorkoutListItemDTO[];
  pagination: PaginationDTO;
  filters: HistoryFilters;
  availableExercises: ExerciseDTO[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

/**
 * State for workout editor (extends WorkoutLogger state)
 */
export interface WorkoutEditorState {
  workoutId: string;
  originalDate: string;
  createdAt: string;
  date: string;
  notes: string | null;
  exercises: {
    id: string;
    name: string;
    type: ExerciseType;
    sets: {
      id?: string;
      sort_order: number;
      weight: number | null;
      reps: number | null;
      distance: number | null;
      time: number | null;
    }[];
  }[];
  isSaving: boolean;
  isDeleting: boolean;
  isLoading: boolean;
}

// ============================================================================
// EXERCISES VIEW TYPES
// ============================================================================

/**
 * Stan widoku Bazy Ćwiczeń
 */
export interface ExercisesViewState {
  // Lista ćwiczeń
  exercises: ExerciseDTO[];

  // Filtry
  searchQuery: string;
  typeFilter: ExerciseTypeFilter;

  // Stany UI
  isLoading: boolean;
  error: string | null;

  // Dialogi
  formDialog: {
    open: boolean;
    mode: "create" | "edit";
    exercise: ExerciseDTO | null;
    isSubmitting: boolean;
  };

  archiveDialog: {
    open: boolean;
    exercise: ExerciseDTO | null;
    isDeleting: boolean;
  };
}

/**
 * Typ filtra ćwiczeń
 */
export type ExerciseTypeFilter = "all" | "strength" | "cardio";

/**
 * Dane formularza ćwiczenia
 */
export interface ExerciseFormData {
  name: string;
  type?: ExerciseType;
}

/**
 * Lista przefiltrowanych ćwiczeń (computed)
 */
export interface FilteredExercises {
  all: ExerciseDTO[];
  system: ExerciseDTO[];
  user: ExerciseDTO[];
  active: ExerciseDTO[];
  archived: ExerciseDTO[];
}

// Props Types dla komponentów Exercises

/**
 * Props dla ExerciseHeader
 */
export interface ExerciseHeaderProps {
  onAddClick: () => void;
}

/**
 * Props dla ExerciseFilters
 */
export interface ExerciseFiltersProps {
  searchQuery: string;
  typeFilter: ExerciseTypeFilter;
  onSearchChange: (query: string) => void;
  onTypeFilterChange: (type: ExerciseTypeFilter) => void;
}

/**
 * Props dla ExerciseList
 */
export interface ExerciseListProps {
  exercises: ExerciseDTO[];
  isLoading: boolean;
  onEdit: (exercise: ExerciseDTO) => void;
  onArchive: (exercise: ExerciseDTO) => void;
}

/**
 * Props dla ExerciseCard
 */
export interface ExerciseCardProps {
  exercise: ExerciseDTO;
  onEdit: (exercise: ExerciseDTO) => void;
  onArchive: (exercise: ExerciseDTO) => void;
}

/**
 * Props dla ExerciseFormDialog
 */
export interface ExerciseFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  exercise?: ExerciseDTO;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateExerciseCommand | UpdateExerciseCommand) => Promise<void>;
}

/**
 * Props dla ConfirmArchiveDialog
 */
export interface ConfirmArchiveDialogProps {
  open: boolean;
  exercise: ExerciseDTO | null;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

// ============================================================================
// DASHBOARD VIEW TYPES
// ============================================================================

/**
 * Stan głównego komponentu Dashboard
 */
export interface DashboardState {
  // Dane z API
  data: DashboardSummaryDTO | null;

  // Filtry
  selectedMonths: number; // 1, 3, 6, lub 12

  // Stany UI
  isLoading: boolean;
  error: string | null;
}

/**
 * Pojedynczy punkt danych wykresu
 */
export interface ChartDataPoint {
  date: string; // Sformatowana data do wyświetlenia
  dateValue: string; // ISO date dla sortowania
  value: number; // Wartość metryki
  label: string; // Etykieta dla tooltip
  workoutId?: string; // Opcjonalne ID treningu dla nawigacji
}

/**
 * Typ metryki dla wykresu (przyszłe rozszerzenie)
 */
export type DashboardMetric =
  | "total_volume" // Łączna objętość
  | "total_workouts" // Liczba treningów
  | "avg_sets" // Średnia liczba serii
  | "unique_exercises"; // Unikalne ćwiczenia

/**
 * Konfiguracja metryki wykresu
 */
export interface DashboardMetricConfig {
  key: DashboardMetric;
  label: string;
  unit: string;
  color: string;
  formatter: (value: number) => string;
}

// Props Types dla komponentów Dashboard

/**
 * Props dla DashboardHeader
 */
export interface DashboardHeaderProps {
  selectedMonths: number;
  onMonthsChange: (months: number) => void;
}

/**
 * Props dla StatsGrid
 */
export interface StatsGridProps {
  stats: SummaryStatsDTO;
  isLoading: boolean;
}

/**
 * Props dla StatCard
 */
export interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | undefined;
  formatter?: (value: number) => string;
  isLoading: boolean;
}

/**
 * Props dla RecentWorkoutsList
 */
export interface RecentWorkoutsListProps {
  workouts: RecentWorkoutDTO[];
  isLoading: boolean;
}

/**
 * Props dla WorkoutSummaryCard
 */
export interface WorkoutSummaryCardProps {
  workout: RecentWorkoutDTO;
  onClick: (workoutId: string) => void;
}

/**
 * Props dla ProgressChartWidget
 */
export interface ProgressChartWidgetProps {
  data: ChartDataPoint[];
  isLoading: boolean;
}

/**
 * Props dla ChartHeader
 */
export interface ChartHeaderProps {
  title: string;
  selectedMetric?: string;
  onMetricChange?: (metric: string) => void;
}

/**
 * Props dla ProgressChart
 */
export interface ProgressChartProps {
  data: ChartDataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  lineColor?: string;
}
