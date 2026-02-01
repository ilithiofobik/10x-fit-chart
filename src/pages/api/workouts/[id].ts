/**
 * GET /api/workouts/:id - Get workout details
 * PUT /api/workouts/:id - Update workout
 * DELETE /api/workouts/:id - Delete workout
 */

import type { APIContext } from "astro";
import { z } from "zod";
import {
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  ExerciseNotFoundError,
  ExerciseTypeMismatchError,
} from "../../../lib/services/workout.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for UpdateWorkoutSetCommand
 */
const UpdateWorkoutSetSchema = z.object({
  id: z.string().uuid().optional(),
  exercise_id: z.string().uuid(),
  sort_order: z.number().int().positive(),
  // Strength fields
  weight: z.number().min(0).max(999.99).nullable().optional(),
  reps: z.number().int().positive().nullable().optional(),
  // Cardio fields
  distance: z.number().min(0).max(999999.99).nullable().optional(),
  time: z.number().int().min(0).nullable().optional(),
});

/**
 * Schema for UpdateWorkoutCommand
 */
const UpdateWorkoutSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().max(1000).nullable().optional(),
  sets: z.array(UpdateWorkoutSetSchema).min(1),
});

// ============================================================================
// GET HANDLER - Get workout details
// ============================================================================

export async function GET(context: APIContext) {
  const workoutId = context.params.id;

  if (!workoutId) {
    return new Response(JSON.stringify({ error: "Workout ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get Supabase client from locals (set by middleware)
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!supabase || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const workout = await getWorkoutById(supabase, user.id, workoutId);

    if (!workout) {
      return new Response(JSON.stringify({ error: "Workout not found or does not belong to user" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(workout), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/workouts/:id:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ============================================================================
// PUT HANDLER - Update workout
// ============================================================================

export async function PUT(context: APIContext) {
  const workoutId = context.params.id;

  if (!workoutId) {
    return new Response(JSON.stringify({ error: "Workout ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get Supabase client from locals (set by middleware)
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!supabase || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse and validate request body
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validation = UpdateWorkoutSchema.safeParse(body);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validation.error.errors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate date is not in the future
  if (validation.data.date) {
    const workoutDate = new Date(validation.data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (workoutDate > today) {
      return new Response(JSON.stringify({ error: "Workout date cannot be in the future" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    const updatedWorkout = await updateWorkout(supabase, user.id, workoutId, validation.data);

    return new Response(JSON.stringify(updatedWorkout), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in PUT /api/workouts/:id:", error);

      if (error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error instanceof ExerciseNotFoundError || error instanceof ExerciseTypeMismatchError) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ============================================================================
// DELETE HANDLER - Delete workout
// ============================================================================

export async function DELETE(context: APIContext) {
  const workoutId = context.params.id;

  if (!workoutId) {
    return new Response(JSON.stringify({ error: "Workout ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get Supabase client from locals (set by middleware)
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  if (!supabase || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await deleteWorkout(supabase, user.id, workoutId);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in DELETE /api/workouts/:id:", error);

      if (error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
