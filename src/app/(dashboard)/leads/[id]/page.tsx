import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLeadById, listAssignableProfiles } from "@/lib/leads/queries";
import { Card, CardContent } from "@/components/ui/card";
import { LeadDetailPanel } from "@/components/leads/lead-detail-panel";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lead, error, notFound }, { data: assignableProfiles }] = await Promise.all([
    getLeadById(supabase, id),
    listAssignableProfiles(supabase),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-900">Lead unavailable</p>
            <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            {error.code && <p className="mt-2 text-xs text-gray-400">Error code: {error.code}</p>}
          </CardContent>
        </Card>
      )}

      {!error && notFound && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-900">Lead not found</p>
            <p className="mt-1 text-sm text-gray-500">This lead may have been deleted.</p>
          </CardContent>
        </Card>
      )}

      {!error && lead && <LeadDetailPanel lead={lead} assignableProfiles={assignableProfiles ?? []} />}
    </div>
  );
}
