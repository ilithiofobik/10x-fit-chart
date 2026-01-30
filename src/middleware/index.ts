import { defineMiddleware } from "astro:middleware";
import { supabaseServer } from "@/db/supabase-server";

/**
 * Middleware for authentication and route protection
 *
 * Responsibilities:
 * 1. Create Supabase client with cookie-based auth
 * 2. Fetch user session and add to locals
 * 3. Protect /app/* routes (redirect to /login if not authenticated)
 * 4. Redirect authenticated users from /login and /register to /app/dashboard
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // 1. Create Supabase client with cookie storage
  const supabase = supabaseServer(context);
  context.locals.supabase = supabase;

  // 2. Fetch user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Add user to locals (null if not authenticated)
  context.locals.user = error ? null : user;

  // 3. Define protected and auth-only routes
  const isProtectedRoute = url.pathname.startsWith("/app");
  const isAuthRoute = ["/login", "/register"].includes(url.pathname);

  // 4. Route protection logic
  if (isProtectedRoute && !user) {
    // Redirect unauthenticated users to login
    return redirect("/login");
  }

  if (isAuthRoute && user) {
    // Redirect authenticated users to dashboard
    return redirect("/app/dashboard");
  }

  // 5. Continue to page rendering
  return next();
});
