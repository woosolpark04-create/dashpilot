"use client";

import { useActionState } from "react";
import { updateUserAction, type UpdateUserState } from "@/lib/users/actions";
import type { UserDetail } from "@/lib/users/queries";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const initialState: UpdateUserState = { status: "idle" };

export function UserEditForm({ user, isSelf }: { user: UserDetail; isSelf: boolean }) {
  const boundAction = updateUserAction.bind(null, user.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {isSelf && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          You&apos;re editing your own account. To prevent locking yourself out, changing your own role away from
          Admin or disabling your own account is blocked here — ask another active admin to do that instead.
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      )}
      {state.status === "success" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Full name
          </label>
          <Input id="full_name" name="full_name" defaultValue={user.fullName ?? ""} className="mt-1" />
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Email</span>
          <p className="mt-1 flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
            {user.email || "—"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Read-only. Changing an Auth user&apos;s sign-in email and changing this profile record are separate
            concerns — this form doesn&apos;t edit email to keep them from getting out of sync.
          </p>
        </div>
        <div>
          <label htmlFor="role" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Role
          </label>
          <Select id="role" name="role" defaultValue={user.role} className="mt-1">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Status
          </label>
          <Select id="status" name="status" defaultValue={user.status} className="mt-1">
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
