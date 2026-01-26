/**
 * /api/exercises endpoints
 * GET - List exercises (returns system and user's own exercises)
 * POST - Create new exercise (user's private exercise)
 */

import type { APIContext } from "astro";
import { z } from "zod";

import { listExercises, createExercise, ExerciseConflictError } from "../../../lib/services/exercise.service";
import type { ListExercisesResponse, ExerciseDTO } from "../../../types";

export const prerender = false;

/**
 * Query parameters validation schema for GET
 */
const QueryParamsSchema = z.object({
  type: z.enum(["strength", "cardio"]).optional(),
  include_archived: z.coerce.boolean().optional().default(false),
});

/**
 * Request body validation schema for POST
 */
const CreateExerciseBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").trim(),
  type: z.enum(["strength", "cardio"], {
    errorMap: () => ({ message: "Type must be 'strength' or 'cardio'" }),
  }),
});

/**
 * GET handler - List exercises
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

  const { type, include_archived } = validationResult.data;

  // Call service to fetch exercises
  try {
    const exercises = await listExercises(locals.supabase, user.id, {
      type,
      includeArchived: include_archived,
    });

    const response: ListExercisesResponse = {
      exercises,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/exercises:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST handler - Create new exercise
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

  const validationResult = CreateExerciseBodySchema.safeParse(requestBody);

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

  const { name, type } = validationResult.data;

  // Call service to create exercise
  try {
    const exercise: ExerciseDTO = await createExercise(locals.supabase, user.id, { name, type });

    return new Response(JSON.stringify(exercise), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle conflict error (duplicate name)
    if (error instanceof ExerciseConflictError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/exercises:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
