/**
 * /api/exercises/:id endpoints
 * PUT - Update exercise name (only for user's private exercises)
 */

import type { APIContext } from "astro";
import { z } from "zod";

import {
  updateExercise,
  ExerciseConflictError,
  NotFoundError,
  ForbiddenError,
} from "../../../lib/services/exercise.service";
import type { UpdateExerciseCommand, ExerciseDTO } from "../../../types";

export const prerender = false;

/**
 * UUID parameter validation schema
 */
const uuidParamSchema = z.string().uuid("Invalid exercise ID format");

/**
 * Request body validation schema for PUT
 */
const UpdateExerciseBodySchema = z.object({
  name: z
    .string({ required_error: "Exercise name is required" })
    .trim()
    .min(1, "Exercise name cannot be empty")
    .max(100, "Exercise name must not exceed 100 characters"),
});

/**
 * PUT handler - Update exercise name
 */
export async function PUT(context: APIContext): Promise<Response> {
  const { locals, request, params } = context;

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
    // Validate UUID parameter
    const exerciseId = uuidParamSchema.parse(params.id);

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validationResult = UpdateExerciseBodySchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationResult.error.errors.map((e) => e.message),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: UpdateExerciseCommand = validationResult.data;

    // Call service to update exercise
    const updatedExercise: ExerciseDTO = await updateExercise(locals.supabase, user.id, exerciseId, command);

    return new Response(JSON.stringify(updatedExercise), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    // Handle Zod validation errors for UUID
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: error.errors.map((e) => e.message),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle forbidden errors (trying to modify system exercise)
    if (error instanceof ForbiddenError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle not found errors (exercise doesn't exist or doesn't belong to user)
    if (error instanceof NotFoundError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle conflict errors (duplicate name)
    if (error instanceof ExerciseConflictError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in PUT /api/exercises/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
