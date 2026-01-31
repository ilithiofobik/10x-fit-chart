import type { APIRoute } from "astro";
import { z } from "zod";
import { getDashboardSummary } from "../../../lib/services/analytics.service";

export const prerender = false;

const monthsParamSchema = z.coerce
  .number()
  .int()
  .min(1, "Months must be at least 1")
  .max(12, "Months must be at most 12")
  .default(3);

/**
 * GET /api/analytics/dashboard
 * Returns dashboard summary with workout statistics for a given period
 * @query months - Number of months to look back (1-12, default: 3)
 */
export const GET: APIRoute = async (context) => {
  const supabase = context.locals.supabase;
  const user = context.locals.user;

  // Guard: Check authentication
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Validate query parameter
    const months = monthsParamSchema.parse(context.url.searchParams.get("months"));

    // Fetch dashboard summary
    const summary = await getDashboardSummary(supabase, user.id, months);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: error.errors.map((e) => e.message),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in GET /api/analytics/dashboard:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
