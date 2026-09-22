"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireActiveAdmin } from "@/lib/auth/require-admin";
import { leadInputSchema, firstLeadValidationMessage } from "@/lib/leads/validation";

export interface LeadFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export interface DeleteLeadState {
  status: "idle" | "error";
  message?: string;
}

// Revalidated together everywhere a lead mutation succeeds: /leads (the list
// this action was called from) and / (Overview), since Phase 3's stat cards
// and "Recent leads" read live from the same `leads` table and would
// otherwise keep showing stale data until an unrelated navigation.
function revalidateLeadRoutes(leadId?: string) {
  revalidatePath("/leads");
  revalidatePath("/");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

/**
 * Shared by create/update: requireActiveAdmin() against the normal
 * session-scoped client (never SUPABASE_SECRET_KEY — leads CRUD relies
 * entirely on the existing `leads_admin_all` RLS policy), then validates
 * `formData` with the same Zod schema either action uses.
 */
async function authorizeAndParseLeadForm(formData: FormData) {
  const supabase = await createClient();
  const authCheck = await requireActiveAdmin(supabase);

  if (!authCheck.ok) {
    return { supabase, values: null, error: authCheck.message ?? "You're not allowed to do this." };
  }

  const parsed = leadInputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { supabase, values: null, error: firstLeadValidationMessage(parsed.error) };
  }

  return { supabase, values: parsed.data, error: null };
}

export async function createLeadAction(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const { supabase, values, error } = await authorizeAndParseLeadForm(formData);

  if (error || !values) {
    return { status: "error", message: error ?? "Please check the form and try again." };
  }

  const { error: insertError } = await supabase.from("leads").insert({
    full_name: values.full_name,
    company: values.company ?? null,
    email: values.email ?? null,
    phone: values.phone ?? null,
    source: values.source ?? null,
    status: values.status,
    value_estimate: values.value_estimate ?? null,
    notes: values.notes ?? null,
  });

  if (insertError) {
    console.error("Failed to create lead:", insertError);
    return { status: "error", message: "We couldn't create this lead. Please try again." };
  }

  revalidateLeadRoutes();

  return { status: "success", message: `${values.full_name} was added to leads.` };
}

export async function updateLeadAction(
  leadId: string,
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const { supabase, values, error } = await authorizeAndParseLeadForm(formData);

  if (error || !values) {
    return { status: "error", message: error ?? "Please check the form and try again." };
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      full_name: values.full_name,
      company: values.company ?? null,
      email: values.email ?? null,
      phone: values.phone ?? null,
      source: values.source ?? null,
      status: values.status,
      value_estimate: values.value_estimate ?? null,
      notes: values.notes ?? null,
      assigned_to: values.assigned_to ?? null,
    })
    .eq("id", leadId);

  if (updateError) {
    console.error("Failed to update lead:", updateError);
    return { status: "error", message: "We couldn't save these changes. Please try again." };
  }

  revalidateLeadRoutes(leadId);

  return { status: "success", message: "Changes saved." };
}

/**
 * Bind the target lead id first: `deleteLeadAction.bind(null, leadId)`. Only
 * ever called from the confirmation dialog, so there's no separate "are you
 * sure" step here — that's the dialog's job. Redirects back to /leads with a
 * query flag the list page renders as a success banner (same pattern as the
 * invite-acceptance flow's `/login?message=`).
 */
export async function deleteLeadAction(
  leadId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's signature
  _prevState: DeleteLeadState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by useActionState's signature
  _formData: FormData,
): Promise<DeleteLeadState> {
  const supabase = await createClient();
  const authCheck = await requireActiveAdmin(supabase);

  if (!authCheck.ok) {
    return { status: "error", message: authCheck.message ?? "You're not allowed to do this." };
  }

  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  if (error) {
    console.error("Failed to delete lead:", error);
    return { status: "error", message: "We couldn't delete this lead. Please try again." };
  }

  revalidateLeadRoutes(leadId);
  redirect("/leads?deleted=1");
}
