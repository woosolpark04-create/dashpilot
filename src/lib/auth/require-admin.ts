import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActiveAdminCheck {
  ok: boolean;
  userId?: string;
  message?: string;
}

/**
 * Verifies the caller using the normal user-scoped Supabase client (real
 * session + RLS), never the admin client. This is the authorization gate
 * for any server action about to use `createAdminClient()` — the secret key
 * itself grants no authorization on its own, so this check must run first,
 * against real session state, not be assumed from context.
 */
export async function requireActiveAdmin(supabase: SupabaseClient): Promise<ActiveAdminCheck> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to verify admin access:", error);
    return { ok: false, message: "We couldn't verify your admin access. Please try again." };
  }

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return { ok: false, message: "Only active admins can do this." };
  }

  return { ok: true, userId: user.id };
}
