import { NextResponse } from "next/server";

// Route protection placeholder. Session checks and redirects to
// (auth)/login are planned for Phase 1 — no auth logic implemented yet.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
