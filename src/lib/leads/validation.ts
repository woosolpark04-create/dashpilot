import { z } from "zod";

export const LEAD_STATUS_VALUES = ["new", "contacted", "qualified", "won", "lost"] as const;
export const LEAD_SOURCE_VALUES = ["website", "referral", "cold_outreach", "other"] as const;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];
export type LeadSource = (typeof LEAD_SOURCE_VALUES)[number];

// Optional <select>/<input> fields submit "" rather than being absent —
// treat that the same as "not provided" before validation runs.
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const leadInputSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(200, "Full name is too long."),
  company: z.preprocess(blankToUndefined, z.string().trim().max(200, "Company name is too long.").optional()),
  email: z.preprocess(
    blankToUndefined,
    z.string().trim().max(320, "Email is too long.").email("Enter a valid email address.").optional(),
  ),
  phone: z.preprocess(blankToUndefined, z.string().trim().max(50, "Phone number is too long.").optional()),
  source: z.preprocess(blankToUndefined, z.enum(LEAD_SOURCE_VALUES).optional()),
  status: z.enum(LEAD_STATUS_VALUES),
  value_estimate: z.preprocess(
    blankToUndefined,
    z.coerce.number().min(0, "Estimated value can't be negative.").optional(),
  ),
  notes: z.preprocess(blankToUndefined, z.string().trim().max(4000, "Notes are too long.").optional()),
  assigned_to: z.preprocess(blankToUndefined, z.string().uuid("That doesn't look like a valid assignee.").optional()),
});

export type LeadInput = z.infer<typeof leadInputSchema>;

/** Zod's own enum/uuid mismatch text is developer-facing — swap in a plain message for those fields. */
export function firstLeadValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Please check the form and try again.";
  if (issue.path[0] === "status" || issue.path[0] === "source") {
    return "Please choose a valid option.";
  }
  if (issue.path[0] === "assigned_to") {
    return "Please choose a valid assignee.";
  }
  return issue.message;
}
