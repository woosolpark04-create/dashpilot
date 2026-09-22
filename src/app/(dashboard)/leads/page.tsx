import Link from "next/link";
import { Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listLeads } from "@/lib/leads/queries";
import { formatCurrency } from "@/lib/dashboard/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadsToolbar } from "@/components/leads/leads-toolbar";
import { CreateLeadDialog } from "@/components/leads/create-lead-dialog";
import { PaginationControls } from "@/components/users/pagination-controls";

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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string; page?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await listLeads(supabase, {
    search: params.q,
    status: params.status,
    source: params.source,
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">Manage sales leads and track your pipeline.</p>
        </div>
        <CreateLeadDialog />
      </div>

      {params.deleted === "1" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Lead deleted.
        </div>
      )}

      <Card>
        <LeadsToolbar />

        {error && (
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-900">Leads unavailable</p>
            <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            {error.code && <p className="mt-2 text-xs text-gray-400">Error code: {error.code}</p>}
          </CardContent>
        )}

        {!error && data && data.leads.length === 0 && (
          <CardContent className="p-6">
            <EmptyState
              icon={Target}
              title={
                params.q || params.status || params.source
                  ? "No leads match your filters"
                  : "No leads yet"
              }
              description={
                params.q || params.status || params.source
                  ? "Try a different search term, or clear your filters to see everyone."
                  : "Leads you add will show up here, newest first."
              }
              action={
                (params.q || params.status || params.source) && (
                  <Link href="/leads" className="text-sm font-medium text-gray-900 hover:underline">
                    Clear filters
                  </Link>
                )
              }
            />
          </CardContent>
        )}

        {!error && data && data.leads.length > 0 && (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Est. value</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Link href={`/leads/${lead.id}`} className="block max-w-[16rem] sm:max-w-xs">
                          <span className="block truncate font-medium text-gray-900">{lead.fullName}</span>
                          <span className="block truncate text-xs text-gray-500">
                            {[lead.company, lead.email].filter(Boolean).join(" · ") || "No details on file"}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>{lead.phone || "—"}</TableCell>
                      <TableCell>{sourceLabel(lead.source)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[lead.status as keyof typeof STATUS_VARIANT] ?? "neutral"} dot>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {lead.valueEstimate != null ? formatCurrency(lead.valueEstimate) : "—"}
                      </TableCell>
                      <TableCell>
                        {new Date(lead.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <PaginationControls
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              searchParams={{ q: params.q, status: params.status, source: params.source }}
            />
          </>
        )}
      </Card>
    </div>
  );
}
