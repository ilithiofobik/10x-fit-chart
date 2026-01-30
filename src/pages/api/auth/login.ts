import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseServer } from "@/db/supabase-server";
import { mapAuthError, isInvalidCredentialsError } from "@/lib/utils/auth-errors";

/**
 * POST /api/auth/login
 *
 * Authenticates user with email and password
 * Sets session cookie on success
 *
 * Request body:
 * - email: string (email format)
 * - password: string (min 1 char)
 *
 * Response:
 * - 200: { message: string, user: { id, email } }
 * - 400: { error: string } - Validation error
 * - 401: { error: string } - Invalid credentials
 */

// Disable prerendering for API routes
export const prerender = false;

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return new Response(JSON.stringify({ error: firstError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email, password } = validation.data;

    // 2. Create Supabase client with cookie storage
    const supabase = supabaseServer({ cookies } as any);

    // 3. Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 4. Handle authentication errors
    if (error) {
      console.error("[Login] Auth error:", error.message);

      const statusCode = isInvalidCredentialsError(error.message) ? 401 : 400;
      const errorMessage = mapAuthError(error.message, "Nie udało się zalogować. Spróbuj ponownie.");

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response
    // Note: Session is automatically set in cookies by supabaseServer
    return new Response(
      JSON.stringify({
        message: "Zalogowano pomyślnie",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // 6. Handle unexpected errors
    console.error("[Login] Unexpected error:", err);

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
