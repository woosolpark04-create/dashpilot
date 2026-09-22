"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  /** Focused on close, so focus never lingers inside the now-hidden drawer. */
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

export function MobileNav({ open, onClose, returnFocusRef }: MobileNavProps) {
  const pathname = usePathname();
  const wasOpenRef = useRef(open);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      returnFocusRef?.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open, returnFocusRef]);

  return (
    <div
      className={cn("fixed inset-0 z-40 md:hidden", open ? "pointer-events-auto" : "pointer-events-none")}
      aria-hidden={!open}
      // `aria-hidden` alone hides the closed drawer from screen readers but
      // doesn't stop a sighted keyboard user from tabbing into its
      // off-screen (translate-x-full) links; `inert` removes it from the
      // tab order too while closed.
      inert={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-gray-900/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-sm font-semibold tracking-tight text-gray-900">DashPilot</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon
                  className={cn("h-4 w-4 shrink-0", active ? "text-gray-900" : "text-gray-400")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
