import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

// Warn loudly if Supabase env vars are missing.
// All Supabase API calls will fail with authentication errors at runtime.
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.error(
    "\n⚠️  SPIRO Hub: Missing Supabase environment variables!\n" +
      "   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local\n" +
      "   See .env.example for the required format.\n",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
