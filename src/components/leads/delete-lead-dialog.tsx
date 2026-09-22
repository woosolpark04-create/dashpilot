"use client";

import { useActionState, useState } from "react";
import { deleteLeadAction, type DeleteLeadState } from "@/lib/leads/actions";
import { Dialog, DialogCloseButton, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const initialState: DeleteLeadState = { status: "idle" };

export function DeleteLeadDialog({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete lead
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DeleteLeadDialogContent
          key={open ? "open" : "closed"}
          leadId={leadId}
          leadName={leadName}
          onClose={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}

function DeleteLeadDialogContent({
  leadId,
  leadName,
  onClose,
}: {
  leadId: string;
  leadName: string;
  onClose: () => void;
}) {
  const boundAction = deleteLeadAction.bind(null, leadId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <>
      <DialogHeader>
        <div>
          <DialogTitle>Delete this lead?</DialogTitle>
          <DialogDescription>
            This permanently deletes <span className="font-medium text-gray-700">{leadName}</span>. This can&apos;t
            be undone.
          </DialogDescription>
        </div>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>

      <form action={formAction}>
        {state.status === "error" && (
          <div className="px-5 pt-5">
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? "Deleting…" : "Delete lead"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
