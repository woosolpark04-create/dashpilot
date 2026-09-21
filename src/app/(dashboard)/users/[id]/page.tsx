import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/users/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserEditForm } from "@/components/users/user-edit-form";

const STATUS_VARIANT = {
  active: "success",
  invited: "info",
  disabled: "neutral",
} as const;

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: user, error, notFound } = await getUserById(supabase, id);

  return (
    <div className="space-y-6">
      <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-900">User unavailable</p>
            <p className="mt-1 text-sm text-gray-500">{error.message}</p>
            {error.code && <p className="mt-2 text-xs text-gray-400">Error code: {error.code}</p>}
          </CardContent>
        </Card>
      )}

      {!error && notFound && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-gray-900">User not found</p>
            <p className="mt-1 text-sm text-gray-500">This user may have been removed.</p>
          </CardContent>
        </Card>
      )}

      {!error && user && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">{user.fullName || "Unnamed user"}</h1>
            <Badge variant={STATUS_VARIANT[user.status as keyof typeof STATUS_VARIANT] ?? "neutral"} dot>
              {user.status}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.fullName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm capitalize text-gray-900">{user.role}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Joined</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Last updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">User ID</dt>
                  <dd className="mt-1 font-mono text-xs text-gray-500">{user.id}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit user</CardTitle>
            </CardHeader>
            <CardContent>
              <UserEditForm user={user} isSelf={authUser?.id === user.id} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
