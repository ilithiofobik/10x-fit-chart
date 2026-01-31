import type { SupabaseClient } from "../../db/supabase.client";
import type { DashboardSummaryDTO, PeriodDTO } from "../../types";

/**
 * Service for analytics and dashboard data
 */

/**
 * Fetches dashboard summary for a user
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch data for
 * @param months - Number of months to look back (1-12)
 * @returns Dashboard summary with period, statistics, and recent workouts
 */
export async function getDashboardSummary(
  supabase: SupabaseClient,
  userId: string,
  months: number
): Promise<DashboardSummaryDTO> {
  // Calculate period
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const period: PeriodDTO = {
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    months,
  };

  // Query workouts with sets for aggregation
  const { data: workouts, error: workoutsError } = await supabase
    .from("workouts")
    .select(
      `
      id,
      workout_sets!inner(
        id,
        exercise_id,
        calculated_volume
      )
    `
    )
    .eq("user_id", userId)
    .gte("date", period.start_date)
    .lte("date", period.end_date);

  if (workoutsError) {
    console.error("Error fetching workouts:", workoutsError);
    throw new Error("Failed to fetch dashboard data");
  }

  // Aggregate summary statistics
  let total_sets = 0;
  let total_volume = 0;
  const unique_exercises = new Set<string>();

  (workouts || []).forEach((workout) => {
    (workout.workout_sets || []).forEach((set) => {
      total_sets++;
      if (set.calculated_volume) {
        total_volume += Number(set.calculated_volume);
      }
      unique_exercises.add(set.exercise_id);
    });
  });

  // Query recent workouts (last 5 within the period)
  const { data: recentWorkouts, error: recentError } = await supabase
    .from("workouts")
    .select(
      `
      id,
      date,
      workout_sets(id, exercise_id)
    `
    )
    .eq("user_id", userId)
    .gte("date", period.start_date)
    .lte("date", period.end_date)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentError) {
    console.error("Error fetching recent workouts:", recentError);
    throw new Error("Failed to fetch recent workouts");
  }

  // Map recent workouts to DTO format
  const recent_workouts = (recentWorkouts || []).map((workout) => {
    const sets = workout.workout_sets || [];
    const exercise_ids = new Set(sets.map((s) => s.exercise_id));

    return {
      id: workout.id,
      date: workout.date,
      exercise_count: exercise_ids.size,
      set_count: sets.length,
    };
  });

  return {
    period,
    summary: {
      total_workouts: workouts?.length || 0,
      total_sets,
      total_volume,
      unique_exercises: unique_exercises.size,
    },
    recent_workouts,
  };
}
