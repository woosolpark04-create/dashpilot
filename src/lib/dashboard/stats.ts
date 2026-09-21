import type { SupabaseClient } from "@supabase/supabase-js";

const ACTIVE_LEAD_STATUSES = ["new", "contacted", "qualified"] as const;

export interface QueryFailure {
  /** Generic, user-safe message — never the raw Postgres/PostgREST error text. */
  message: string;
  /** Postgres/PostgREST error code (e.g. "42501"), safe to surface for debugging. */
  code?: string;
}

export interface TrendResult {
  direction: "up" | "down" | "flat";
  label: string;
  /** [previous period, current period] — real values only, never fabricated. */
  series: [number, number];
}

export interface StatResult {
  value: number;
  trend: TrendResult;
}

export interface OverviewStats {
  totalUsers: StatResult;
  totalLeads: StatResult;
  activeLeads: StatResult;
  /** Dollar amount. */
  wonThisMonth: StatResult;
}

export interface RecentLead {
  id: string;
  fullName: string;
  company: string | null;
  email: string | null;
  status: string;
  valueEstimate: number | null;
  createdAt: string;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function monthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

// Avoids a misleading "% change" when the previous period was zero (division
// by zero would either be Infinity or require inventing a number). Falls
// back to a plain "+N <noun>" count instead.
function trendFromCounts(current: number, previous: number, noun: string): TrendResult {
  const direction = current > previous ? "up" : current < previous ? "down" : "flat";
  if (previous === 0) {
    return {
      direction,
      label: current === 0 ? "No change vs last month" : `+${current} ${noun} vs last month`,
      series: [previous, current],
    };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    direction,
    label: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`,
    series: [previous, current],
  };
}

function trendFromCurrency(current: number, previous: number): TrendResult {
  const direction = current > previous ? "up" : current < previous ? "down" : "flat";
  if (previous === 0) {
    return {
      direction,
      label: current === 0 ? "No change vs last month" : `${formatCurrency(current)} — none won last month`,
      series: [previous, current],
    };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    direction,
    label: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs last month`,
    series: [previous, current],
  };
}

function sumValueEstimate(rows: { value_estimate: number | string | null }[] | null) {
  return (rows ?? []).reduce((sum, row) => sum + Number(row.value_estimate ?? 0), 0);
}

const GENERIC_STATS_ERROR: QueryFailure = {
  message: "We couldn't load your dashboard statistics right now.",
};

/**
 * Real Supabase-backed overview stats for the admin dashboard.
 *
 * Trend limitation (documented per spec, not fixed here): "Active leads" has
 * no historical snapshot to compare against — the schema has no audit/history
 * table recording what a lead's status was as of a past date, only its
 * *current* status plus `created_at`. A literal "vs previous month-end"
 * comparison would require inventing that history, which we won't do. The
 * accurate substitute used here compares, among *currently* active leads,
 * how many were created this month vs last month — a real, computable signal
 * about pipeline freshness, not a point-in-time reconstruction.
 */
export async function getOverviewStats(
  supabase: SupabaseClient,
): Promise<{ data: OverviewStats | null; error: QueryFailure | null }> {
  const current = monthRange(0);
  const previous = monthRange(1);

  try {
    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalLeads,
      leadsThisMonth,
      leadsLastMonth,
      activeLeads,
      activeCreatedThisMonth,
      activeCreatedLastMonth,
      wonThisMonthRows,
      wonLastMonthRows,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "user")
        .gte("created_at", current.start)
        .lt("created_at", current.end),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "user")
        .gte("created_at", previous.start)
        .lt("created_at", previous.end),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", current.start)
        .lt("created_at", current.end),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", previous.start)
        .lt("created_at", previous.end),
      supabase.from("leads").select("id", { count: "exact", head: true }).in("status", ACTIVE_LEAD_STATUSES),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("status", ACTIVE_LEAD_STATUSES)
        .gte("created_at", current.start)
        .lt("created_at", current.end),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .in("status", ACTIVE_LEAD_STATUSES)
        .gte("created_at", previous.start)
        .lt("created_at", previous.end),
      supabase
        .from("leads")
        .select("value_estimate")
        .eq("status", "won")
        .gte("created_at", current.start)
        .lt("created_at", current.end),
      supabase
        .from("leads")
        .select("value_estimate")
        .eq("status", "won")
        .gte("created_at", previous.start)
        .lt("created_at", previous.end),
    ]);

    const results = [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      totalLeads,
      leadsThisMonth,
      leadsLastMonth,
      activeLeads,
      activeCreatedThisMonth,
      activeCreatedLastMonth,
      wonThisMonthRows,
      wonLastMonthRows,
    ];
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      console.error("Failed to load overview stats:", failed.error);
      return { data: null, error: { ...GENERIC_STATS_ERROR, code: failed.error.code } };
    }

    const wonThisMonthValue = sumValueEstimate(wonThisMonthRows.data);
    const wonLastMonthValue = sumValueEstimate(wonLastMonthRows.data);

    const data: OverviewStats = {
      totalUsers: {
        value: totalUsers.count ?? 0,
        trend: trendFromCounts(newUsersThisMonth.count ?? 0, newUsersLastMonth.count ?? 0, "new users"),
      },
      totalLeads: {
        value: totalLeads.count ?? 0,
        trend: trendFromCounts(leadsThisMonth.count ?? 0, leadsLastMonth.count ?? 0, "new leads"),
      },
      activeLeads: {
        value: activeLeads.count ?? 0,
        trend: trendFromCounts(
          activeCreatedThisMonth.count ?? 0,
          activeCreatedLastMonth.count ?? 0,
          "new active leads",
        ),
      },
      wonThisMonth: {
        value: wonThisMonthValue,
        trend: trendFromCurrency(wonThisMonthValue, wonLastMonthValue),
      },
    };

    return { data, error: null };
  } catch (err) {
    console.error("Unexpected error loading overview stats:", err);
    return { data: null, error: GENERIC_STATS_ERROR };
  }
}

export async function getRecentLeads(
  supabase: SupabaseClient,
): Promise<{ data: RecentLead[] | null; error: QueryFailure | null }> {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("id, full_name, company, email, status, value_estimate, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Failed to load recent leads:", error);
      return {
        data: null,
        error: { message: "We couldn't load recent leads right now.", code: error.code },
      };
    }

    return {
      data: (data ?? []).map((lead) => ({
        id: lead.id,
        fullName: lead.full_name,
        company: lead.company,
        email: lead.email,
        status: lead.status,
        valueEstimate: lead.value_estimate,
        createdAt: lead.created_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error loading recent leads:", err);
    return { data: null, error: { message: "We couldn't load recent leads right now." } };
  }
}
