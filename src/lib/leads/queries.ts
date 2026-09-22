import type { SupabaseClient } from "@supabase/supabase-js";

export interface QueryFailure {
  /** Generic, user-safe message — never the raw Postgres/PostgREST error text. */
  message: string;
  /** Postgres/PostgREST error code (e.g. "42501"), safe to surface for debugging. */
  code?: string;
}

export const LEADS_PAGE_SIZE = 10;

const VALID_STATUSES = new Set(["new", "contacted", "qualified", "won", "lost"]);
const VALID_SOURCES = new Set(["website", "referral", "cold_outreach", "other"]);

export interface LeadRow {
  id: string;
  fullName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  valueEstimate: number | null;
  createdAt: string;
}

export interface ListLeadsParams {
  /** Raw, unvalidated values straight from URL search params. */
  search?: string;
  status?: string;
  source?: string;
  page?: string | number;
}

export interface ListLeadsResult {
  leads: LeadRow[];
  total: number;
  page: number;
  pageSize: number;
}

// PostgREST's `.or()` filter string uses commas/parentheses as its own
// delimiters, so a search term containing them would otherwise corrupt the
// filter. Wrapping the value in double quotes (escaping any literal double
// quote) is PostgREST's documented escape mechanism.
function quoteForOrFilter(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function parsePage(page: ListLeadsParams["page"]): number {
  const n = Number(page);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

const GENERIC_LIST_ERROR: QueryFailure = { message: "We couldn't load the leads list right now." };

export async function listLeads(
  supabase: SupabaseClient,
  params: ListLeadsParams,
): Promise<{ data: ListLeadsResult | null; error: QueryFailure | null }> {
  let page = parsePage(params.page);

  const status = params.status && VALID_STATUSES.has(params.status) ? params.status : undefined;
  const source = params.source && VALID_SOURCES.has(params.source) ? params.source : undefined;
  const search = params.search?.trim();

  function buildQuery() {
    let query = supabase
      .from("leads")
      .select("id, full_name, company, email, phone, source, status, value_estimate, created_at", {
        count: "exact",
      });

    if (status) query = query.eq("status", status);
    if (source) query = query.eq("source", source);
    if (search) {
      const term = quoteForOrFilter(`%${search}%`);
      query = query.or(`full_name.ilike.${term},company.ilike.${term},email.ilike.${term}`);
    }
    return query;
  }

  // PostgREST's own response to an out-of-range offset — e.g. a bookmarked
  // `?page=50` after most of those rows were deleted, or a filter that now
  // matches far fewer rows — isn't an empty result, it's an error
  // (`PGRST103: Requested range not satisfiable`). Rendering that as "Leads
  // unavailable" would be a confusing dead end for a request that's really
  // just asking for a page number that no longer exists, so it's treated as
  // a signal to clamp to the real last page and retry once, the same as the
  // empty-result case below.
  const RANGE_NOT_SATISFIABLE = "PGRST103";

  try {
    const from0 = (page - 1) * LEADS_PAGE_SIZE;
    const first = await buildQuery()
      .order("created_at", { ascending: false })
      .range(from0, from0 + LEADS_PAGE_SIZE - 1);

    let data = first.data;
    let total = first.count ?? 0;

    if (first.error) {
      if (first.error.code !== RANGE_NOT_SATISFIABLE) {
        console.error("Failed to list leads:", first.error);
        return { data: null, error: { ...GENERIC_LIST_ERROR, code: first.error.code } };
      }

      const { count, error: countError } = await buildQuery().range(0, 0);
      if (countError) {
        console.error("Failed to list leads:", countError);
        return { data: null, error: { ...GENERIC_LIST_ERROR, code: countError.code } };
      }
      total = count ?? 0;
      data = [];
    }

    const lastPage = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));
    if (page > lastPage) {
      page = lastPage;
      const from1 = (page - 1) * LEADS_PAGE_SIZE;
      const retry = await buildQuery()
        .order("created_at", { ascending: false })
        .range(from1, from1 + LEADS_PAGE_SIZE - 1);

      if (retry.error) {
        console.error("Failed to list leads:", retry.error);
        return { data: null, error: { ...GENERIC_LIST_ERROR, code: retry.error.code } };
      }
      data = retry.data;
    }

    return {
      data: {
        leads: (data ?? []).map((row) => ({
          id: row.id,
          fullName: row.full_name,
          company: row.company,
          email: row.email,
          phone: row.phone,
          source: row.source,
          status: row.status,
          valueEstimate: row.value_estimate,
          createdAt: row.created_at,
        })),
        total,
        page,
        pageSize: LEADS_PAGE_SIZE,
      },
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error listing leads:", err);
    return { data: null, error: GENERIC_LIST_ERROR };
  }
}

export interface LeadDetail {
  id: string;
  fullName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  valueEstimate: number | null;
  notes: string | null;
  assignedTo: string | null;
  assignedName: string | null;
  assignedEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

// Postgres raises 22P02 ("invalid input syntax for type uuid") when `id`
// isn't even a well-formed UUID — worth a clearer message than the generic
// query-failure one, since it's a very likely outcome of a hand-edited URL.
const INVALID_UUID_CODE = "22P02";

interface AssignedProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

export async function getLeadById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: LeadDetail | null; error: QueryFailure | null; notFound: boolean }> {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select(
        "id, full_name, company, email, phone, source, status, value_estimate, notes, assigned_to, created_at, updated_at, assigned:profiles!assigned_to(id, full_name, email)",
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load lead:", error);
      if (error.code === INVALID_UUID_CODE) {
        return {
          data: null,
          notFound: false,
          error: { message: "That doesn't look like a valid lead ID.", code: error.code },
        };
      }
      return {
        data: null,
        notFound: false,
        error: { message: "We couldn't load this lead right now.", code: error.code },
      };
    }

    if (!data) {
      return { data: null, notFound: true, error: null };
    }

    const assigned = (Array.isArray(data.assigned) ? data.assigned[0] : data.assigned) as
      | AssignedProfileRow
      | null;

    return {
      data: {
        id: data.id,
        fullName: data.full_name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        source: data.source,
        status: data.status,
        valueEstimate: data.value_estimate,
        notes: data.notes,
        assignedTo: data.assigned_to,
        assignedName: assigned?.full_name ?? null,
        assignedEmail: assigned?.email ?? null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      notFound: false,
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error loading lead:", err);
    return { data: null, notFound: false, error: { message: "We couldn't load this lead right now." } };
  }
}

export interface AssignableProfile {
  id: string;
  fullName: string | null;
  email: string | null;
}

// Leads are assigned to staff (active admins), not to the platform users
// managed in /users — those rows represent customers/managed accounts, not
// people who'd work a sales pipeline.
export async function listAssignableProfiles(
  supabase: SupabaseClient,
): Promise<{ data: AssignableProfile[] | null; error: QueryFailure | null }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .eq("status", "active")
      .order("full_name", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Failed to list assignable profiles:", error);
      return { data: null, error: { message: "We couldn't load assignable admins right now.", code: error.code } };
    }

    return {
      data: (data ?? []).map((row) => ({ id: row.id, fullName: row.full_name, email: row.email })),
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error listing assignable profiles:", err);
    return { data: null, error: { message: "We couldn't load assignable admins right now." } };
  }
}
