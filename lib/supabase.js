import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
