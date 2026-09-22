"use client";

import { useActionState, useEffect } from "react";
import { updateUserAction, type UpdateUserState } from "@/lib/users/actions";
import type { UserDetail } from "@/lib/users/queries";
import { blockImplicitSubmit } from "@/lib/utils";
import { useEditMode } from "@/hooks/use-edit-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const STATUS_VARIANT = {
  active: "success",
  invited: "info",
  disabled: "neutral",
} as const;

const initialState: UpdateUserState = { status: "idle" };

export function UserDetailPanel({ user, isSelf }: { user: UserDetail; isSelf: boolean }) {
  const { isEditing, editSession, savedMessage, startEditing, cancelEditing, handleSaved } = useEditMode();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">{user.fullName || "Unnamed user"}</h1>
          <Badge variant={STATUS_VARIANT[user.status as keyof typeof STATUS_VARIANT] ?? "neutral"} dot>
            {user.status}
          </Badge>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={startEditing}>
            Edit user
          </Button>
        )}
      </div>

      {!isEditing && savedMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {savedMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <UserEditFields
              key={editSession}
              user={user}
              isSelf={isSelf}
              onCancel={cancelEditing}
              onSaved={handleSaved}
            />
          ) : (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.fullName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</dt>
                <dd className="mt-1 text-sm capitalize text-gray-900">{user.role}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Last updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.updatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">User ID</dt>
                <dd className="mt-1 font-mono text-xs text-gray-500">{user.id}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserEditFields({
  user,
  isSelf,
  onCancel,
  onSaved,
}: {
  user: UserDetail;
  isSelf: boolean;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const boundAction = updateUserAction.bind(null, user.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      onSaved(state.message ?? "Changes saved.");
    }
  }, [state, onSaved]);

  return (
    <form action={formAction} onKeyDown={blockImplicitSubmit} className="space-y-4">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit_full_name" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Full name
          </label>
          <Input id="edit_full_name" name="full_name" defaultValue={user.fullName ?? ""} disabled={isPending} className="mt-1" />
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
          <label htmlFor="edit_role" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Role
          </label>
          <Select id="edit_role" name="role" defaultValue={user.role} disabled={isPending} className="mt-1">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <div>
          <label htmlFor="edit_status" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Status
          </label>
          <Select id="edit_status" name="status" defaultValue={user.status} disabled={isPending} className="mt-1">
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
