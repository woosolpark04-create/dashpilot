import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/users/queries";
import { Card, CardContent } from "@/components/ui/card";
import { UserDetailPanel } from "@/components/users/user-detail-panel";

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

      {!error && user && <UserDetailPanel user={user} isSelf={authUser?.id === user.id} />}
    </div>
  );
}
