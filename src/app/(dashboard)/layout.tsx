import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth/actions";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders: proxy.ts already redirects unauthenticated
  // requests to /login, but a Server Component shouldn't assume a request
  // reached it only via the proxy.
  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    // A genuine query failure (permissions, network, etc.) must not be
    // treated the same as "no profile found" without a trace — log it
    // server-side and fail closed (isActiveAdmin stays false) below.
    console.error("Failed to load profile for authorization check:", profileError);
  }

  const isActiveAdmin =
    !profileError && profile?.role === "admin" && profile?.status === "active";

  if (!isActiveAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Access restricted</h1>
          <p className="mt-2 text-sm text-gray-500">
            This account does not have active admin access to DashPilot.
          </p>

          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <span className="text-sm font-semibold text-gray-900">DashPilot</span>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 transition hover:text-gray-900"
          >
            Sign out
          </button>
        </form>
      </header>
      {/* Sidebar + nav shell planned for Phase 2 */}
      <main className="p-6">{children}</main>
    </div>
  );
}
