"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type CallbackStatus = "processing" | "error";

/**
 * Exchanges whatever Supabase put in the URL for a real session, using the
 * normal user-scoped browser client — never the admin client. This has to
 * run client-side (not a route handler) because Supabase's default invite
 * email template can land the user back here with the session tokens in a
 * URL hash fragment (`#access_token=...`), which is never sent to the
 * server, alongside the two other shapes it can also use depending on
 * project auth settings (`?code=` for PKCE, `?token_hash=&type=` for OTP
 * verification) — so all three are handled here.
 */
export function AuthCallbackClient() {
  const router = useRouter();
  const [status, setStatus] = useState<CallbackStatus>("processing");

  useEffect(() => {
    let cancelled = false;

    async function completeInvite() {
      const supabase = createClient();

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      let error: { message: string } | null = null;

      if (accessToken && refreshToken) {
        ({ error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }));
      } else if (code) {
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      } else if (tokenHash && type) {
        ({ error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        }));
      } else {
        error = { message: "Missing invite parameters." };
      }

      if (cancelled) return;

      if (error) {
        console.error("Invite callback failed:", error);
        setStatus("error");
        return;
      }

      router.replace("/set-password");
    }

    completeInvite();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "error") {
    return (
      <>
        <h1 className="text-lg font-semibold text-gray-900">This invite link isn&apos;t valid</h1>
        <p className="mt-1 text-sm text-gray-500">
          It may have expired or already been used. Ask an admin to send a new invite, or sign in
          below if you already have a password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Back to login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-gray-900">Setting up your account…</h1>
      <p className="mt-1 text-sm text-gray-500">Hang tight, we&apos;re verifying your invite.</p>
    </>
  );
}
