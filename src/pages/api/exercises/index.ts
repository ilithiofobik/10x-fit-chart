/**
 * GET /api/exercises
 * List exercises endpoint - returns system and user's own exercises
 */

import type { APIContext } from "astro";
import { z } from "zod";

import { listExercises } from "../../../lib/services/exercise.service";
import type { ListExercisesResponse } from "../../../types";

export const prerender = false;

/**
 * Query parameters validation schema
 */
const QueryParamsSchema = z.object({
  type: z.enum(["strength", "cardio"]).optional(),
  include_archived: z.coerce.boolean().optional().default(false),
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
    console.error("Error in GET /api/exercises:", error);
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
