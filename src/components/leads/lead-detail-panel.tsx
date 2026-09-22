"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { updateLeadAction, type LeadFormState } from "@/lib/leads/actions";
import { LEAD_STATUS_VALUES, LEAD_SOURCE_VALUES } from "@/lib/leads/validation";
import type { LeadDetail, AssignableProfile } from "@/lib/leads/queries";
import { formatCurrency } from "@/lib/dashboard/stats";
import { blockImplicitSubmit } from "@/lib/utils";
import { useEditMode } from "@/hooks/use-edit-mode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DeleteLeadDialog } from "@/components/leads/delete-lead-dialog";

const STATUS_VARIANT = {
  new: "info",
  contacted: "neutral",
  qualified: "warning",
  won: "success",
  lost: "danger",
} as const;

function sourceLabel(source: string | null) {
  if (!source) return "—";
  return source === "cold_outreach" ? "Cold outreach" : source.charAt(0).toUpperCase() + source.slice(1);
}

const initialState: LeadFormState = { status: "idle" };

export function LeadDetailPanel({
  lead,
  assignableProfiles,
}: {
  lead: LeadDetail;
  assignableProfiles: AssignableProfile[];
}) {
  const { isEditing, editSession, savedMessage, startEditing, cancelEditing, handleSaved } = useEditMode();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">{lead.fullName}</h1>
          <Badge variant={STATUS_VARIANT[lead.status as keyof typeof STATUS_VARIANT] ?? "neutral"} dot>
            {lead.status}
          </Badge>
        </div>
        <div className="flex gap-3">
          {!isEditing && (
            <Button variant="outline" onClick={startEditing}>
              Edit lead
            </Button>
          )}
          <DeleteLeadDialog leadId={lead.id} leadName={lead.fullName} />
        </div>
      </div>

      {!isEditing && savedMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {savedMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <LeadEditFields
              key={editSession}
              lead={lead}
              assignableProfiles={assignableProfiles}
              onCancel={cancelEditing}
              onSaved={handleSaved}
            />
          ) : (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.company || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Source</dt>
                <dd className="mt-1 text-sm text-gray-900">{sourceLabel(lead.source)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Est. value</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {lead.valueEstimate != null ? formatCurrency(lead.valueEstimate) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Assigned to</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.assignedName || lead.assignedEmail || "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(lead.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Last updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(lead.updatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{lead.notes || "No notes yet."}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LeadEditFields({
  lead,
  assignableProfiles,
  onCancel,
  onSaved,
}: {
  lead: LeadDetail;
  assignableProfiles: AssignableProfile[];
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const boundAction = updateLeadAction.bind(null, lead.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      onSaved(state.message ?? "Changes saved.");
    }
  }, [state, onSaved]);

  return (
    <form action={formAction} onKeyDown={blockImplicitSubmit} className="space-y-4">
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
          <Input
            id="edit_full_name"
            name="full_name"
            required
            defaultValue={lead.fullName}
            disabled={isPending}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="edit_company" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Company
          </label>
          <Input id="edit_company" name="company" defaultValue={lead.company ?? ""} disabled={isPending} className="mt-1" />
        </div>
        <div>
          <label htmlFor="edit_email" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Email
          </label>
          <Input
            id="edit_email"
            name="email"
            type="email"
            defaultValue={lead.email ?? ""}
            disabled={isPending}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="edit_phone" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Phone
          </label>
          <Input id="edit_phone" name="phone" type="tel" defaultValue={lead.phone ?? ""} disabled={isPending} className="mt-1" />
        </div>
        <div>
          <label htmlFor="edit_value_estimate" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Est. value
          </label>
          <Input
            id="edit_value_estimate"
            name="value_estimate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={lead.valueEstimate ?? ""}
            disabled={isPending}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="edit_source" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Source
          </label>
          <Select id="edit_source" name="source" defaultValue={lead.source ?? ""} disabled={isPending} className="mt-1">
            <option value="">No source specified</option>
            {LEAD_SOURCE_VALUES.map((source) => (
              <option key={source} value={source}>
                {sourceLabel(source)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="edit_status" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Status
          </label>
          <Select id="edit_status" name="status" defaultValue={lead.status} disabled={isPending} className="mt-1">
            {LEAD_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="edit_assigned_to" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
            Assigned to
          </label>
          <Select
            id="edit_assigned_to"
            name="assigned_to"
            defaultValue={lead.assignedTo ?? ""}
            disabled={isPending}
            className="mt-1"
          >
            <option value="">Unassigned</option>
            {assignableProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.fullName || profile.email || profile.id}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="edit_notes" className="block text-xs font-medium uppercase tracking-wide text-gray-500">
          Notes
        </label>
        <Textarea id="edit_notes" name="notes" rows={4} defaultValue={lead.notes ?? ""} disabled={isPending} className="mt-1" />
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
