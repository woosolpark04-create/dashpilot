import Link from "next/link";
import { Users as UsersIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/users/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UsersToolbar } from "@/components/users/users-toolbar";
import { PaginationControls } from "@/components/users/pagination-controls";
import { InviteUserDialog } from "@/components/users/invite-user-dialog";

const STATUS_VARIANT = {
  active: "success",
  invited: "info",
  disabled: "neutral",
} as const;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await listUsers(supabase, {
    search: params.q,
    role: params.role,
    status: params.status,
    page: params.page,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage admin and user accounts.</p>
        </div>
        <InviteUserDialog />
      </div>

      <Card>
        <UsersToolbar />

        {error && (
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-900">Users unavailable</p>
            <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            {error.code && <p className="mt-2 text-xs text-gray-400">Error code: {error.code}</p>}
          </CardContent>
        )}

        {!error && data && data.users.length === 0 && (
          <CardContent className="p-6">
            <EmptyState
              icon={UsersIcon}
              title="No users match your filters"
              description="Try a different search term, or clear your filters to see everyone."
              action={
                <Link href="/users" className="text-sm font-medium text-gray-900 hover:underline">
                  Clear filters
                </Link>
              }
            />
          </CardContent>
        )}

        {!error && data && data.users.length > 0 && (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Link href={`/users/${user.id}`} className="block">
                          <span className="font-medium text-gray-900">{user.fullName || "Unnamed user"}</span>
                          <span className="block text-xs text-gray-500">{user.email || "No email on file"}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[user.status as keyof typeof STATUS_VARIANT] ?? "neutral"} dot>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
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
            <PaginationControls page={data.page} pageSize={data.pageSize} total={data.total} searchParams={params} />
          </>
        )}
      </Card>
    </div>
  );
}
