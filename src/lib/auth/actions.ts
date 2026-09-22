"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password.")}`);
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface SetPasswordState {
  status: "idle" | "error";
  message?: string;
}

/**
 * Used by both the invite-acceptance flow and any signed-in user changing
 * their own password. Runs against the normal user-scoped client — the
 * session already established by /auth/callback (or an existing login) is
 * what authorizes this, never the admin client. `auth.updateUser()` only
 * touches Supabase Auth's own password hash; it never writes to `profiles`,
 * so `role`/`status` (set once by `handle_new_user()`) are untouched here.
 */
export async function setPasswordAction(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirm_password");

  if (
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    !password ||
    !confirmPassword
  ) {
    return { status: "error", message: "Please fill out both password fields." };
  }
  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "Those passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Your invite session has expired. Please ask an admin to send a new invite.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Failed to set password:", error);
    return { status: "error", message: "We couldn't set your password. Please try again." };
  }

  // Sign out the temporary invite session so the user signs back in fresh
  // with the password they just chose, confirming it actually works.
  await supabase.auth.signOut();
  redirect(
    `/login?message=${encodeURIComponent("Your account is ready. Sign in with your new password.")}`,
  );
}
