import type { AstroGlobal } from "astro";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

/**
 * Creates a Supabase client for server-side rendering
 * This client handles cookies properly for authentication
 * @param Astro - Astro global object containing cookies
 */
export function supabaseServer(Astro: AstroGlobal) {
  return createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    auth: {
      storage: {
        getItem: (key: string) => {
          const value = Astro.cookies.get(key)?.value ?? null;
          // Debug: log what Supabase is trying to read
          if (import.meta.env.DEV) {
            console.log(`[Supabase Storage] GET: ${key} =`, value ? "exists" : "null");
          }
          return value;
        },
        setItem: (key: string, value: string) => {
          // Debug: log what Supabase is trying to write
          if (import.meta.env.DEV) {
            console.log(`[Supabase Storage] SET: ${key}`);
          }

          Astro.cookies.set(key, value, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: "lax",
            secure: import.meta.env.PROD, // Only HTTPS in production
            httpOnly: false, // Required for Supabase client-side access
          });
        },
        removeItem: (key: string) => {
          // Debug: log what Supabase is trying to remove
          if (import.meta.env.DEV) {
            console.log(`[Supabase Storage] REMOVE: ${key}`);
          }
          Astro.cookies.delete(key, { path: "/" });
        },
      },
    },
  });
}
