import type { APIRoute } from "astro";
import { supabaseServer } from "@/db/supabase-server";
import { mapAuthError } from "@/lib/utils/auth-errors";

/**
 * POST /api/auth/logout
 *
 * Signs out the current user and clears session cookies
 *
 * Request body: None (or empty)
 *
 * Response:
 * - 200: { message: string }
 * - 500: { error: string }
 */

// Disable prerendering for API routes
export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // 1. Create Supabase client with cookie storage
    const supabase = supabaseServer({ cookies } as any);

    // 2. Sign out user
    const { error } = await supabase.auth.signOut();

    // 3. Handle sign out errors
    if (error) {
      console.error("[Logout] Auth error:", error.message);

      const errorMessage = mapAuthError(error.message, "Nie udało się wylogować. Spróbuj ponownie.");

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Return success response
    // Note: Cookies are automatically cleared by supabaseServer
    return new Response(
      JSON.stringify({
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // 5. Handle unexpected errors
    console.error("[Logout] Unexpected error:", err);

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
