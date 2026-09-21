import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Static demo rows — search/filter/pagination controls below are visual
// only for Phase 2; wiring them to real data is Phase 5 (Leads Management).
const DEMO_LEADS = [
  { id: "1", name: "Acme Robotics", contact: "priya@acmerobotics.dev", source: "website", status: "qualified", value: "$4,200" },
  { id: "2", name: "Northwind Traders", contact: "sam@northwind.co", source: "referral", status: "new", value: "$1,800" },
  { id: "3", name: "Blue Harbor Studio", contact: "j.lee@blueharbor.io", source: "cold_outreach", status: "contacted", value: "$6,500" },
  { id: "4", name: "Fernwood Labs", contact: "hello@fernwoodlabs.com", source: "referral", status: "won", value: "$9,000" },
  { id: "5", name: "Lumen Analytics", contact: "team@lumen.ai", source: "website", status: "lost", value: "$2,100" },
];

const STATUS_VARIANT = {
  new: "info",
  contacted: "neutral",
  qualified: "warning",
  won: "success",
  lost: "danger",
} as const;

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">
            Demo data shown below — full CRUD, search, filtering, and pagination land in Phase 5.
          </p>
        </div>
        <Button disabled>Add lead</Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search leads…" className="pl-9" disabled />
          </div>
          <Select defaultValue="" disabled className="sm:w-44">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </Select>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_LEADS.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="block">
                      <span className="font-medium text-gray-900">{lead.name}</span>
                      <span className="block text-xs text-gray-500">{lead.contact}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{lead.source.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[lead.status as keyof typeof STATUS_VARIANT]}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{lead.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">Showing 5 of 42 leads (demo)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
