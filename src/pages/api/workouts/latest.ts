/**
 * /api/workouts/latest endpoint
 * GET - Get user's most recent workout with full details
 */

import type { APIContext } from "astro";
import { getLatestWorkout } from "../../../lib/services/workout.service";

export const prerender = false;

/**
 * GET handler - Get latest workout
 * Returns the most recent workout by date with all sets and exercise information
 */
export async function GET(context: APIContext): Promise<Response> {
  const { locals } = context;

  // Guard: Check authorization
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch latest workout from service
    const latestWorkout = await getLatestWorkout(locals.supabase, user.id);

    // Handle case where user has no workouts yet
    if (!latestWorkout) {
      return new Response(JSON.stringify({ error: "No workouts found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return successful response with workout details
    return new Response(JSON.stringify(latestWorkout), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache for 60s in browser, allow stale content during revalidation
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    // Log unexpected errors for debugging
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/workouts/latest:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
