/**
 * /api/workouts endpoints
 * GET - List workouts (returns user's workouts with pagination and aggregated stats)
 * POST - Create new workout (with sets in single transaction)
 */

import type { APIContext } from "astro";
import { z } from "zod";

import {
  listWorkouts,
  createWorkout,
  ExerciseNotFoundError,
  ExerciseTypeMismatchError,
} from "../../../lib/services/workout.service";
import type { ListWorkoutsResponse, WorkoutDetailsDTO } from "../../../types";

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
 * Request body validation schema for POST
 */
const CreateWorkoutSetSchema = z.object({
  exercise_id: z.string().uuid("Invalid exercise ID format"),
  sort_order: z.number().int().positive("Sort order must be positive"),
  weight: z.number().min(0).max(999.99).nullable().optional(),
  reps: z.number().int().min(0).nullable().optional(),
  distance: z.number().min(0).max(999999.99).nullable().optional(),
  time: z.number().int().min(0).nullable().optional(),
});

const CreateWorkoutBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  notes: z.string().nullable().optional(),
  sets: z.array(CreateWorkoutSetSchema).min(1, "At least one set is required"),
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

/**
 * POST handler - Create new workout with sets
 */
export async function POST(context: APIContext): Promise<Response> {
  const { locals, request } = context;

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

  // Parse and validate request body
  let requestBody;
  try {
    requestBody = await request.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = CreateWorkoutBodySchema.safeParse(requestBody);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid request body",
        errors: validationResult.error.format(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { date, notes, sets } = validationResult.data;

  // Call service to create workout
  try {
    const workout: WorkoutDetailsDTO = await createWorkout(locals.supabase, user.id, {
      date,
      notes,
      sets,
    });

    return new Response(JSON.stringify(workout), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle exercise not found error
    if (error instanceof ExerciseNotFoundError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle exercise type mismatch error
    if (error instanceof ExerciseTypeMismatchError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/workouts:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
