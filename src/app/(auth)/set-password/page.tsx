import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export default async function SetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Session expired</h1>
        <p className="mt-1 text-sm text-gray-500">
          We couldn&apos;t find an active invite session. The link may have expired or already
          been used.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Back to login
        </Link>
      </main>
    );
  }

  return (
    <main className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-900">Set your password</h1>
      <p className="mt-1 text-sm text-gray-500">
        Choose a password for <span className="font-medium text-gray-700">{user.email}</span> to
        finish setting up your account.
      </p>
      <SetPasswordForm />
    </main>
  );
}
