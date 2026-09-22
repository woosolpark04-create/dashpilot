import type { SupabaseClient } from "@supabase/supabase-js";

export interface QueryFailure {
  /** Generic, user-safe message — never the raw Postgres/PostgREST error text. */
  message: string;
  /** Postgres/PostgREST error code (e.g. "42501"), safe to surface for debugging. */
  code?: string;
}

export const USERS_PAGE_SIZE = 10;

const VALID_ROLES = new Set(["admin", "user"]);
const VALID_STATUSES = new Set(["active", "invited", "disabled"]);

export interface ProfileRow {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export interface ListUsersParams {
  /** Raw, unvalidated values straight from URL search params. */
  search?: string;
  role?: string;
  status?: string;
  page?: string | number;
}

export interface ListUsersResult {
  users: ProfileRow[];
  total: number;
  page: number;
  pageSize: number;
}

// PostgREST's `.or()` filter string uses commas/parentheses as its own
// delimiters, so a search term containing them would otherwise corrupt the
// filter. Wrapping the value in double quotes (escaping any literal double
// quote) is PostgREST's documented escape mechanism — safer than trying to
// strip or reject characters from user input.
function quoteForOrFilter(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function parsePage(page: ListUsersParams["page"]): number {
  const n = Number(page);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export async function listUsers(
  supabase: SupabaseClient,
  params: ListUsersParams,
): Promise<{ data: ListUsersResult | null; error: QueryFailure | null }> {
  let page = parsePage(params.page);

  const role = params.role && VALID_ROLES.has(params.role) ? params.role : undefined;
  const status = params.status && VALID_STATUSES.has(params.status) ? params.status : undefined;
  const search = params.search?.trim();

  function buildQuery() {
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, status, created_at", { count: "exact" });

    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);
    if (search) {
      const term = quoteForOrFilter(`%${search}%`);
      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
    }
    return query;
  }

  // PostgREST's own response to an out-of-range offset — e.g. a bookmarked
  // `?page=50` after most of those rows were deleted, or a filter that now
  // matches far fewer rows — isn't an empty result, it's an error
  // (`PGRST103: Requested range not satisfiable`). Rendering that as "Users
  // unavailable" would be a confusing dead end for a request that's really
  // just asking for a page number that no longer exists, so it's treated as
  // a signal to clamp to the real last page and retry once.
  const RANGE_NOT_SATISFIABLE = "PGRST103";

  try {
    const from0 = (page - 1) * USERS_PAGE_SIZE;
    const first = await buildQuery()
      .order("created_at", { ascending: false })
      .range(from0, from0 + USERS_PAGE_SIZE - 1);

    let data = first.data;
    let total = first.count ?? 0;

    if (first.error) {
      if (first.error.code !== RANGE_NOT_SATISFIABLE) {
        console.error("Failed to list users:", first.error);
        return {
          data: null,
          error: { message: "We couldn't load the user list right now.", code: first.error.code },
        };
      }

      const { count, error: countError } = await buildQuery().range(0, 0);
      if (countError) {
        console.error("Failed to list users:", countError);
        return {
          data: null,
          error: { message: "We couldn't load the user list right now.", code: countError.code },
        };
      }
      total = count ?? 0;
      data = [];
    }

    const lastPage = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
    if (page > lastPage) {
      page = lastPage;
      const from1 = (page - 1) * USERS_PAGE_SIZE;
      const retry = await buildQuery()
        .order("created_at", { ascending: false })
        .range(from1, from1 + USERS_PAGE_SIZE - 1);

      if (retry.error) {
        console.error("Failed to list users:", retry.error);
        return {
          data: null,
          error: { message: "We couldn't load the user list right now.", code: retry.error.code },
        };
      }
      data = retry.data;
    }

    return {
      data: {
        users: (data ?? []).map((row) => ({
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          role: row.role,
          status: row.status,
          createdAt: row.created_at,
        })),
        total,
        page,
        pageSize: USERS_PAGE_SIZE,
      },
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error listing users:", err);
    return { data: null, error: { message: "We couldn't load the user list right now." } };
  }
}

export interface UserDetail {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Postgres raises 22P02 ("invalid input syntax for type uuid") when `id`
// isn't even a well-formed UUID — worth a clearer message than the generic
// query-failure one, since it's a very likely outcome of a hand-edited URL.
const INVALID_UUID_CODE = "22P02";

export async function getUserById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: UserDetail | null; error: QueryFailure | null; notFound: boolean }> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load user:", error);
      if (error.code === INVALID_UUID_CODE) {
        return {
          data: null,
          notFound: false,
          error: { message: "That doesn't look like a valid user ID.", code: error.code },
        };
      }
      return {
        data: null,
        notFound: false,
        error: { message: "We couldn't load this user right now.", code: error.code },
      };
    }

    if (!data) {
      return { data: null, notFound: true, error: null };
    }

    return {
      data: {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        role: data.role,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      notFound: false,
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error loading user:", err);
    return { data: null, notFound: false, error: { message: "We couldn't load this user right now." } };
  }
}
