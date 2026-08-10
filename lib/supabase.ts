import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Both are validated at call time below rather than at module load, so an
// unconfigured env doesn't break importing this module.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireUrl(): string {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }
  return supabaseUrl;
}

export async function createClient() {
  if (!supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is required"
    );
  }
  const cookieStore = await cookies();
  return createSupabaseClient(requireUrl(), supabaseKey, {
    auth: {
      persistSession: true,
      storage: {
        // The adapter is void-returning and null-based; next/headers' cookie
        // store returns undefined and a ResponseCookies chain, so bridge both.
        getItem: (key: string) => cookieStore.get(key)?.value ?? null,
        setItem: (key: string, value: string) => {
          cookieStore.set(key, value);
        },
        removeItem: (key: string) => {
          cookieStore.delete(key);
        },
      },
    },
  });
}

// Admin client that bypasses RLS
export function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }
  return createSupabaseClient(requireUrl(), supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
