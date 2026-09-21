"use client";

import { useActionState, useState } from "react";
import { inviteUserAction, type InviteUserState } from "@/lib/users/actions";
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: InviteUserState = { status: "idle" };

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite user</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Remounting on every open/close resets the form and its
            useActionState — otherwise a prior success/error message would
            still be showing the next time the dialog opens. */}
        <InviteUserDialogContent key={open ? "open" : "closed"} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function InviteUserDialogContent({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(inviteUserAction, initialState);

  if (state.status === "success") {
    return (
      <>
        <DialogHeader>
          <div>
            <DialogTitle>Invitation sent</DialogTitle>
          </div>
          <DialogCloseButton onClose={onClose} />
        </DialogHeader>
        <div className="p-5">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.message}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <div>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>They&apos;ll receive an email invitation to set up their account.</DialogDescription>
        </div>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>

      <form action={formAction}>
        <div className="space-y-4 p-5">
          {state.status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          )}

          <div>
            <label htmlFor="invite_full_name" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Full name
            </label>
            <Input id="invite_full_name" name="full_name" required disabled={isPending} className="mt-1" />
          </div>

          <div>
            <label htmlFor="invite_email" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Email
            </label>
            <Input
              id="invite_email"
              name="email"
              type="email"
              required
              disabled={isPending}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Sending…" : "Send invite"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
