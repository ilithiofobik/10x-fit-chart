import type { User } from "@supabase/supabase-js";

/**
 * Type-safe authentication guard for API routes
 * Throws a Response if user is not authenticated
 *
 * @param locals - Astro locals object containing user
 * @returns Authenticated user object
 * @throws Response with 401 status if user is not authenticated
 *
 * @example
 * ```ts
 * export const GET: APIRoute = async ({ locals }) => {
 *   const user = requireAuth(locals);
 *   // user is guaranteed to be non-null here
 * }
 * ```
 */
export function requireAuth(locals: App.Locals): User {
  if (!locals.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return locals.user;
}

/**
 * Checks if user is authenticated without throwing
 * Useful for conditional logic
 *
 * @param locals - Astro locals object
 * @returns true if user is authenticated
 */
export function isAuthenticated(locals: App.Locals): boolean {
  return !!locals.user;
}

/**
 * Gets user or returns null
 * Useful when authentication is optional
 *
 * @param locals - Astro locals object
 * @returns User object or null
 */
export function getUser(locals: App.Locals): User | null {
  return locals.user ?? null;
}
