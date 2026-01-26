/**
 * GET /api/workouts
 * List workouts endpoint - returns user's workouts with pagination and aggregated stats
 */

import type { APIContext } from "astro";
import { z } from "zod";

import { listWorkouts } from "../../../lib/services/workout.service";
import type { ListWorkoutsResponse } from "../../../types";

export const prerender = false;

/**
 * Query parameters validation schema for GET
 */
const QueryParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD").optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET handler - List workouts with pagination
 */
export async function GET(context: APIContext): Promise<Response> {
  const { locals, url } = context;

  // Guard: Check authorization
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate query parameters
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const validationResult = QueryParamsSchema.safeParse(searchParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid query parameters",
        errors: validationResult.error.format(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { limit, offset, start_date, end_date, order } = validationResult.data;

  // Call service to fetch workouts
  try {
    const response: ListWorkoutsResponse = await listWorkouts(locals.supabase, user.id, {
      limit,
      offset,
      startDate: start_date,
      endDate: end_date,
      order,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/workouts:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
