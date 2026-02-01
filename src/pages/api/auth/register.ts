import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseServer } from "@/db/supabase-server";
import { mapAuthError, isEmailExistsError } from "@/lib/utils/auth-errors";

/**
 * POST /api/auth/register
 *
 * Creates new user account and automatically logs them in
 * Sets session cookie on success
 *
 * Request body:
 * - email: string (email format)
 * - password: string (min 8 chars)
 *
 * Response:
 * - 201: { message: string, user: { id, email } }
 * - 400: { error: string } - Validation error
 * - 409: { error: string } - Email already exists
 */

// Disable prerendering for API routes
export const prerender = false;

// Validation schema (stricter than login)
const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return new Response(JSON.stringify({ error: firstError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validation.data;

    // 2. Create Supabase client with cookie storage
    const supabase = supabaseServer({ cookies } as { cookies: typeof cookies });

    // 3. Attempt to register user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // No email confirmation required for MVP
        emailRedirectTo: undefined,
      },
    });

    // 4. Handle registration errors
    if (error) {
      console.error("[Register] Auth error:", error.message);

      // Check if email already exists
      const statusCode = isEmailExistsError(error.message) ? 409 : 400;
      const errorMessage = mapAuthError(error.message, "Nie udało się utworzyć konta. Spróbuj ponownie.");

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Check if user was created successfully
    if (!data.user) {
      console.error("[Register] User creation failed - no user returned");
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta. Spróbuj ponownie.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Return success response
    // Note: Session is automatically set in cookies by supabaseServer
    // User is now logged in automatically
    return new Response(
      JSON.stringify({
        message: "Konto utworzone pomyślnie",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // 7. Handle unexpected errors
    console.error("[Register] Unexpected error:", err);

    return new Response(
      JSON.stringify({
        error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
