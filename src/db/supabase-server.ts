import type { AstroGlobal } from "astro";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Creates a Supabase client for server-side rendering
 * This client handles cookies properly for authentication
 * @param Astro - Astro global object containing cookies
 */
export function supabaseServer(Astro: AstroGlobal) {
  return createClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            return Astro.cookies.get(key)?.value ?? null;
          },
          setItem: (key: string, value: string) => {
            Astro.cookies.set(key, value, {
              path: "/",
              maxAge: 60 * 60 * 24 * 7, // 7 days
              sameSite: "lax",
              secure: true,
            });
          },
          removeItem: (key: string) => {
            Astro.cookies.delete(key, { path: "/" });
          },
        },
      },
    }
  );
}
