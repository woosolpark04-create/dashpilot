"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveAdmin } from "@/lib/auth/require-admin";

export interface UpdateUserState {
  status: "idle" | "success" | "error";
  message?: string;
}

export interface InviteUserState {
  status: "idle" | "success" | "error";
  message?: string;
}

const VALID_ROLES = new Set(["admin", "user"]);
const VALID_STATUSES = new Set(["active", "invited", "disabled"]);

/**
 * Bind the target user id first: `updateUserAction.bind(null, userId)`,
 * then pass the bound function to `useActionState`.
 *
 * Self-lockout guard: neither RLS nor the `guard_profiles_protected_fields`
 * trigger stops an active admin from demoting or disabling *themselves* —
 * both only check "is the caller currently an active admin", which is still
 * true right up until this exact update commits. That check has to live
 * here, at the application layer, which is also why this file exists
 * instead of the DB alone being trusted for it.
 */
export async function updateUserAction(
  userId: string,
  _prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Please sign in again." };
  }

  const fullName = (formData.get("full_name") as string | null)?.trim() || null;
  const role = formData.get("role") as string | null;
  const status = formData.get("status") as string | null;

  if (!role || !VALID_ROLES.has(role)) {
    return { status: "error", message: "Please choose a valid role." };
  }
  if (!status || !VALID_STATUSES.has(status)) {
    return { status: "error", message: "Please choose a valid status." };
  }

  const isSelf = user.id === userId;
  if (isSelf && role !== "admin") {
    return {
      status: "error",
      message:
        "You can't remove your own admin role — this would lock you out of the dashboard. Ask another active admin to do this instead.",
    };
  }
  if (isSelf && status !== "active") {
    return {
      status: "error",
      message:
        "You can't disable your own account — this would lock you out of the dashboard. Ask another active admin to do this instead.",
    };
  }

  // Only full_name/role/status are editable here. `id`/`created_at` are
  // never sent (and are backstopped by the existing DB trigger regardless);
  // `email` is deliberately excluded too — profiles.email and the Auth
  // user's actual sign-in email are separate concerns, and updating one
  // without the other would silently desync them.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      status,
    })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update user:", error);
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);

  return { status: "success", message: "Changes saved." };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getInviteRedirectUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = configured ? configured.replace(/\/$/, "") : "http://localhost:3000";
  return `${base}/auth/callback`;
}

/**
 * Admin-only invite flow. Authorization happens against the normal
 * user-scoped client (`requireActiveAdmin`) *before* the admin client is
 * ever created — the secret key itself is not treated as authorization.
 *
 * `full_name` is passed only as auth user metadata; role/status are never
 * settable by the inviter. The existing `handle_new_user()` trigger on
 * `auth.users` creates the resulting `profiles` row exactly as it does for
 * self-signup — role='user', status='active' — since this phase's spec
 * requires that trigger stay untouched.
 */
export async function inviteUserAction(
  _prevState: InviteUserState,
  formData: FormData,
): Promise<InviteUserState> {
  const supabase = await createClient();
  const authCheck = await requireActiveAdmin(supabase);

  if (!authCheck.ok) {
    return { status: "error", message: authCheck.message ?? "You're not allowed to do this." };
  }

  const fullName = (formData.get("full_name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();

  if (!fullName) {
    return { status: "error", message: "Please enter a full name." };
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("Admin client unavailable for invite:", err);
    return { status: "error", message: "Invitations aren't configured for this environment yet." };
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: getInviteRedirectUrl(),
  });

  if (error) {
    console.error("Failed to invite user:", error);
    if (error.code === "email_exists" || /already (been )?registered|already exists/i.test(error.message)) {
      return {
        status: "error",
        message: "Someone with this email already has an account or a pending invite.",
      };
    }
    return { status: "error", message: "We couldn't send this invite. Please try again." };
  }

  revalidatePath("/users");

  return { status: "success", message: `Invitation sent to ${email}.` };
}
