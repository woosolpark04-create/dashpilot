"use client";

import { useRef, useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";

export interface AppShellProps {
  name: string;
  email: string;
  logoutAction: () => void;
  children: ReactNode;
}

export function AppShell({ name, email, logoutAction, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Shared with MobileNav so it can return focus here on close — otherwise
  // focus stays on whatever was focused inside the drawer (e.g. its own
  // close button) even after that element becomes aria-hidden/inert,
  // which browsers rightly flag as a keyboard-accessibility bug.
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        returnFocusRef={menuButtonRef}
      />

      <div className="md:pl-64">
        <Topbar
          onMenuClick={() => setMobileNavOpen(true)}
          name={name}
          email={email}
          logoutAction={logoutAction}
          menuButtonRef={menuButtonRef}
        />
        <main className="px-4 py-8 sm:px-6 md:px-8 md:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
