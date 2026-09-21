import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Static demo profile — real lookups/edits land in Phase 4.
  const user = {
    name: "Priya Natarajan",
    email: "priya@acmerobotics.dev",
    role: "admin",
    status: "active",
    joined: "Jan 12, 2026",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to users
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">User {id}</h1>
          <Button variant="outline" disabled>
            Edit user
          </Button>
        </div>
        <p className="mt-1 text-sm text-gray-500">Demo profile shown — real data lookup lands in Phase 4.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</dt>
              <dd className="mt-1 text-sm capitalize text-gray-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
              <dd className="mt-1">
                <Badge variant="success">{user.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Joined</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.joined}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
