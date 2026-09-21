import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Static demo lead — real lookups/edits land in Phase 5.
  const lead = {
    name: "Acme Robotics",
    contact: "priya@acmerobotics.dev",
    phone: "+1 (555) 019-2231",
    company: "Acme Robotics Inc.",
    source: "website",
    status: "qualified",
    value: "$4,200",
    notes: "Interested in the annual plan; follow up after their Q3 budget review.",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Lead {id}</h1>
          <Button variant="outline" disabled>
            Edit lead
          </Button>
        </div>
        <p className="mt-1 text-sm text-gray-500">Demo lead shown — real data lookup lands in Phase 5.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.name}</dd>
              <dd className="text-xs text-gray-500">{lead.contact}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.company}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Source</dt>
              <dd className="mt-1 text-sm capitalize text-gray-900">{lead.source}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
              <dd className="mt-1">
                <Badge variant="warning">{lead.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Est. value</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{lead.value}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{lead.notes}</p>
        </CardContent>
      </Card>
    </div>
  );
}
