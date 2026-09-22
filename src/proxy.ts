import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// /auth/callback and /set-password are part of the invite-acceptance flow:
// /auth/callback runs before any session exists (it's what creates one), and
// /set-password needs to render its own "session expired" state for an
// invalid/reused invite link rather than being bounced straight to /login.
const PUBLIC_PATHS = ["/login", "/auth/callback", "/set-password"];

// Session refresh + coarse route protection. This only checks "is there a
// valid Supabase session" and redirects to /login when there isn't one.
// Authorization (is this session an active admin?) is a DB lookup against
// `profiles`, and lives in the (dashboard) layout instead — keeping that out
// of the proxy avoids a profile query on every single request, including
// ones for public/static paths.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Always re-validate with getUser() (hits Supabase Auth), never
  // getSession() (reads an unverified cookie) — this is also what
  // refreshes an expiring session's cookies via setAll above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
