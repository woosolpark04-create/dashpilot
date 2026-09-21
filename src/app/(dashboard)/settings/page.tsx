import { Settings as SettingsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Read-only: this is the same self-row lookup already permitted by RLS
  // for the (dashboard) layout's authorization check, reused here to avoid
  // showing a fake identity for the admin's own account.
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, email, role, status, created_at").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your DashPilot admin account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile?.full_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile?.email ?? user?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Role</dt>
              <dd className="mt-1 text-sm capitalize text-gray-900">{profile?.role ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Status</dt>
              <dd className="mt-1">
                <Badge variant={profile?.status === "active" ? "success" : "neutral"}>
                  {profile?.status ?? "unknown"}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <EmptyState
            icon={SettingsIcon}
            title="More settings are coming soon"
            description="Workspace preferences, notifications, and team settings will land in a later phase."
          />
        </CardContent>
      </Card>
    </div>
  );
}
