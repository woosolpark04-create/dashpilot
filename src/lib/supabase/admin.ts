import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// The `server-only` import above is a build-time guard, not just a naming
// convention: if this module is ever imported (even transitively) into a
// Client Component, the Next.js build fails immediately, rather than
// silently shipping SUPABASE_SECRET_KEY into a browser bundle.
//
// This client bypasses RLS entirely (it authenticates as the Supabase
// project itself, not as a signed-in user), so it must NEVER be the thing
// deciding whether a request is allowed — callers are responsible for
// verifying the caller is an active admin (see src/lib/auth/require-admin.ts)
// using the normal user-scoped client *before* reaching for this one.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Supabase admin client is not configured: SUPABASE_SECRET_KEY is missing.");
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
