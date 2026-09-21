"use client";

import { Menu } from "lucide-react";
import { AccountMenu } from "./account-menu";

export interface TopbarProps {
  onMenuClick: () => void;
  name: string;
  email: string;
  logoutAction: () => void;
}

export function Topbar({ onMenuClick, name, email, logoutAction }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/75 md:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-sm font-medium text-gray-900 md:hidden">DashPilot</span>
      <div className="ml-auto">
        <AccountMenu name={name} email={email} logoutAction={logoutAction} />
      </div>
    </header>
  );
}
