import type { APIRoute } from "astro";
import { supabaseServer } from "@/db/supabase-server";
import { requireAuth } from "@/lib/utils/auth-guards";
import { mapAuthError } from "@/lib/utils/auth-errors";

/**
 * DELETE /api/auth/delete-account
 *
 * Permanently deletes user account and all associated data
 * Implements US-003 (Trwałe usuwanie konta)
 *
 * Cascade deletion:
 * - All workouts and workout_sets (via foreign key cascade)
 * - All custom exercises (user_id = current user)
 * - User account from auth.users
 *
 * Request body: None (authentication via session)
 *
 * Response:
 * - 200: { message: string }
 * - 401: { error: string } - Not authenticated
 * - 500: { error: string } - Deletion failed
 */

// Disable prerendering for API routes
export const prerender = false;

export const DELETE: APIRoute = async ({ locals, cookies }) => {
  try {
    // 1. Verify authentication
    const user = requireAuth(locals);

    // 2. Create Supabase client with cookie storage
    const supabase = supabaseServer({ cookies } as any);

    // 3. Call database function to delete user and all associated data
    // This function uses SECURITY DEFINER to safely delete from auth.users
    const { data: deleteResult, error: deleteError } = await supabase.rpc("delete_user_account");

    if (deleteError) {
      console.error("[DeleteAccount] RPC error:", deleteError);

      // If deletion fails, still sign out the user for security
      await supabase.auth.signOut();

      return new Response(
        JSON.stringify({
          error: mapAuthError(deleteError.message, "Nie udało się usunąć konta. Spróbuj ponownie."),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log deletion details (for debugging)
    if (deleteResult) {
      console.log("[DeleteAccount] Success:", deleteResult);
    }

    // 6. Sign out user (cleanup session)
    await supabase.auth.signOut();

    // 7. Return success response
    return new Response(
      JSON.stringify({
        message: "Konto zostało usunięte",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // 8. Handle unexpected errors
    console.error("[DeleteAccount] Unexpected error:", err);

    // If error is a Response (from requireAuth), re-throw it
    if (err instanceof Response) {
      return err;
    }

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
