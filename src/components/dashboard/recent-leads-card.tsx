import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRecentLeads, formatCurrency } from "@/lib/dashboard/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_VARIANT = {
  new: "info",
  contacted: "neutral",
  qualified: "warning",
  won: "success",
  lost: "danger",
} as const;

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function RecentLeadsCard() {
  const supabase = await createClient();
  const { data, error } = await getRecentLeads(supabase);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent leads</CardTitle>
        <Link
          href="/leads"
          className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          View all
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </CardHeader>

      {error && (
        <CardContent className="mt-3 p-5 text-center">
          <p className="text-sm font-medium text-gray-900">Recent leads unavailable</p>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
          {error.code && <p className="mt-2 text-xs text-gray-400">Error code: {error.code}</p>}
        </CardContent>
      )}

      {!error && data && data.length === 0 && (
        <CardContent className="mt-3 p-5">
          <EmptyState
            icon={Target}
            title="No leads yet"
            description="Leads you add will show up here, newest first."
          />
        </CardContent>
      )}

      {!error && data && data.length > 0 && (
        <CardContent className="mt-3 divide-y divide-gray-100 p-0">
          {data.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {initials(lead.fullName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {lead.fullName}
                    {lead.company ? ` · ${lead.company}` : ""}
                  </p>
                  <p className="truncate text-xs text-gray-500">{lead.email ?? "No email on file"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden text-xs text-gray-400 sm:block">
                  {formatRelativeDate(lead.createdAt)}
                </span>
                <Badge variant={STATUS_VARIANT[lead.status as keyof typeof STATUS_VARIANT] ?? "neutral"} dot>
                  {lead.status}
                </Badge>
                <span className="w-16 text-right text-sm font-medium tabular-nums text-gray-900">
                  {lead.valueEstimate != null ? formatCurrency(lead.valueEstimate) : "—"}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
