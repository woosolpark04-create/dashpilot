"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccountMenuProps {
  name: string;
  email: string;
  logoutAction: () => void;
}

export function AccountMenu({ name, email, logoutAction }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initial = (name || email || "?").charAt(0).toUpperCase();
  // A raw email (especially the domain half) is what makes the header feel
  // crowded — prefer the display name, and fall back to just the local part
  // of the email rather than the whole address.
  const shortIdentity = name || email.split("@")[0] || email;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2 text-sm transition-colors hover:bg-gray-100"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate text-left font-medium text-gray-900 sm:block">
          {shortIdentity}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-md border border-gray-200 bg-white py-1 shadow-lg",
          open ? "block" : "hidden",
        )}
      >
        <div className="border-b border-gray-100 px-3 py-2">
          <p className="truncate text-sm font-medium text-gray-900">{name || "Admin"}</p>
          <p className="truncate text-xs text-gray-500">{email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
