/**
 * Test Fixtures
 * Reusable mock data for tests
 */

import type {
  Exercise,
  WorkoutDetailsDTO,
  CreateWorkoutCommand,
  WorkoutSetDTO,
  DashboardSummaryDTO,
  WorkoutListItemDTO,
} from "@/types";

// ============================================================================
// EXERCISES
// ============================================================================

export const mockExerciseStrength: Exercise = {
  id: "test-bench-press-id",
  user_id: null, // System exercise
  name: "Bench Press",
  type: "strength",
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

export const mockExerciseCardio: Exercise = {
  id: "test-running-id",
  user_id: null, // System exercise
  name: "Running",
  type: "cardio",
  is_archived: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

export const mockUserExercise: Exercise = {
  id: "test-user-exercise-id",
  user_id: "test-user-id",
  name: "Cable Flyes",
  type: "strength",
  is_archived: false,
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
};

export const mockArchivedExercise: Exercise = {
  id: "test-archived-id",
  user_id: "test-user-id",
  name: "Old Exercise",
  type: "strength",
  is_archived: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2026-01-20T15:00:00Z",
};

// ============================================================================
// WORKOUT SETS
// ============================================================================

export const mockWorkoutSetStrength: WorkoutSetDTO = {
  id: "test-set-1",
  workout_id: "test-workout-id",
  exercise_id: "test-bench-press-id",
  exercise_name: "Bench Press",
  exercise_type: "strength",
  sort_order: 1,
  weight: 100,
  reps: 8,
  distance: null,
  time: null,
  calculated_1rm: 125.0,
  calculated_volume: 800,
  created_at: "2026-02-01T20:05:00Z",
  updated_at: "2026-02-01T20:05:00Z",
};

export const mockWorkoutSetCardio: WorkoutSetDTO = {
  id: "test-set-2",
  workout_id: "test-workout-id",
  exercise_id: "test-running-id",
  exercise_name: "Running",
  exercise_type: "cardio",
  sort_order: 2,
  weight: null,
  reps: null,
  distance: 5.0,
  time: 30, // 30 minutes
  calculated_1rm: null,
  calculated_volume: null,
  created_at: "2026-02-01T20:10:00Z",
  updated_at: "2026-02-01T20:10:00Z",
};

// ============================================================================
// WORKOUTS
// ============================================================================

export const mockCreateWorkoutCommand: CreateWorkoutCommand = {
  date: "2026-02-01",
  notes: "Test workout",
  sets: [
    {
      exercise_id: "test-bench-press-id",
      sort_order: 1,
      weight: 100,
      reps: 8,
    },
    {
      exercise_id: "test-bench-press-id",
      sort_order: 2,
      weight: 100,
      reps: 7,
    },
  ],
};

export const mockWorkoutDetails: WorkoutDetailsDTO = {
  id: "test-workout-id",
  user_id: "test-user-id",
  date: "2026-02-01",
  notes: "Test workout",
  created_at: "2026-02-01T20:00:00Z",
  updated_at: "2026-02-01T20:00:00Z",
  sets: [mockWorkoutSetStrength],
};

export const mockWorkoutListItem: WorkoutListItemDTO = {
  id: "test-workout-id",
  user_id: "test-user-id",
  date: "2026-02-01",
  notes: "Test workout",
  exercise_count: 2,
  set_count: 5,
  created_at: "2026-02-01T20:00:00Z",
  updated_at: "2026-02-01T20:00:00Z",
};

// ============================================================================
// DASHBOARD
// ============================================================================

export const mockDashboardSummary: DashboardSummaryDTO = {
  period: {
    start_date: "2025-11-01",
    end_date: "2026-02-01",
    months: 3,
  },
  summary: {
    total_workouts: 12,
    total_sets: 60,
    total_volume: 48000,
    unique_exercises: 8,
  },
  recent_workouts: [
    mockWorkoutListItem,
    {
      ...mockWorkoutListItem,
      id: "test-workout-2",
      date: "2026-01-30",
      exercise_count: 3,
      set_count: 9,
    },
  ],
};

// ============================================================================
// USER / AUTH
// ============================================================================

export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
};

export const mockLocalsAuthenticated = {
  user: mockUser,
  supabase: {} as unknown,
};

export const mockLocalsUnauthenticated = {
  user: null,
  supabase: {} as unknown,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a mock fetch response
 */
export function mockFetchResponse<T>(data: T, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({ "Content-Type": "application/json" }),
  } as Response);
}

/**
 * Create a mock fetch error
 */
export function mockFetchError(message: string, status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
    headers: new Headers({ "Content-Type": "application/json" }),
  } as Response);
}

/**
 * Wait for async operations (useful in tests)
 */
export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
