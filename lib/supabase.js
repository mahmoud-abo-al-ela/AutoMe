import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createClient() {
  const cookieStore = await cookies();
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      storage: {
        getItem: (key) => cookieStore.get(key)?.value,
        setItem: (key, value) => cookieStore.set(key, value),
        removeItem: (key) => cookieStore.delete(key),
      },
    },
  });
}

// Admin client that bypasses RLS
export function createAdminClient() {
  if (!supabaseServiceKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is not defined!");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }
  console.log("Creating admin client with service key");
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
