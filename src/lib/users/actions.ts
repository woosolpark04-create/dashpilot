"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface UpdateUserState {
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
