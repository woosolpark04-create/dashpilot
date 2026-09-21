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
  const page = parsePage(params.page);
  const from = (page - 1) * USERS_PAGE_SIZE;
  const to = from + USERS_PAGE_SIZE - 1;

  const role = params.role && VALID_ROLES.has(params.role) ? params.role : undefined;
  const status = params.status && VALID_STATUSES.has(params.status) ? params.status : undefined;
  const search = params.search?.trim();

  try {
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, status, created_at", { count: "exact" });

    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);
    if (search) {
      const term = quoteForOrFilter(`%${search}%`);
      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);
    }

    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) {
      console.error("Failed to list users:", error);
      return {
        data: null,
        error: { message: "We couldn't load the user list right now.", code: error.code },
      };
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
        total: count ?? 0,
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
