"use client";

import { useActionState, useState } from "react";
import { createLeadAction, type LeadFormState } from "@/lib/leads/actions";
import { LEAD_STATUS_VALUES, LEAD_SOURCE_VALUES } from "@/lib/leads/validation";
import {
  Dialog,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialState: LeadFormState = { status: "idle" };

function sourceLabel(source: string) {
  return source === "cold_outreach" ? "Cold outreach" : source.charAt(0).toUpperCase() + source.slice(1);
}

export function CreateLeadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add lead</Button>
      <Dialog open={open} onOpenChange={setOpen} className="max-w-lg">
        {/* Remounting on open/close resets the form and its useActionState,
            so a prior success/error message doesn't linger on reopen. */}
        <CreateLeadDialogContent key={open ? "open" : "closed"} onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function CreateLeadDialogContent({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createLeadAction, initialState);

  if (state.status === "success") {
    return (
      <>
        <DialogHeader>
          <div>
            <DialogTitle>Lead added</DialogTitle>
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
          <DialogTitle>Add a new lead</DialogTitle>
          <DialogDescription>Track a new prospect in your pipeline.</DialogDescription>
        </div>
        <DialogCloseButton onClose={onClose} />
      </DialogHeader>

      <form action={formAction}>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
          {state.status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          )}

          <div>
            <label htmlFor="lead_full_name" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Full name<span aria-hidden="true" className="text-red-500"> *</span>
            </label>
            <Input id="lead_full_name" name="full_name" required disabled={isPending} className="mt-1" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lead_company" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Company
              </label>
              <Input id="lead_company" name="company" disabled={isPending} className="mt-1" />
            </div>
            <div>
              <label htmlFor="lead_email" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </label>
              <Input id="lead_email" name="email" type="email" disabled={isPending} className="mt-1" />
            </div>
            <div>
              <label htmlFor="lead_phone" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Phone
              </label>
              <Input id="lead_phone" name="phone" type="tel" disabled={isPending} className="mt-1" />
            </div>
            <div>
              <label htmlFor="lead_value_estimate" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Est. value
              </label>
              <Input
                id="lead_value_estimate"
                name="value_estimate"
                type="number"
                min="0"
                step="0.01"
                disabled={isPending}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="lead_source" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Source
              </label>
              <Select id="lead_source" name="source" defaultValue="" disabled={isPending} className="mt-1">
                <option value="">No source specified</option>
                {LEAD_SOURCE_VALUES.map((source) => (
                  <option key={source} value={source}>
                    {sourceLabel(source)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="lead_status" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </label>
              <Select id="lead_status" name="status" defaultValue="new" disabled={isPending} className="mt-1">
                {LEAD_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="lead_notes" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
              Notes
            </label>
            <Textarea id="lead_notes" name="notes" rows={3} disabled={isPending} className="mt-1" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding…" : "Add lead"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
