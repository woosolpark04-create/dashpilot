import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Static demo rows — search/filter/pagination controls below are visual
// only for Phase 2; wiring them to real data is Phase 4 (User Management).
const DEMO_USERS = [
  { id: "1", name: "Priya Natarajan", email: "priya@acmerobotics.dev", role: "admin", status: "active", joined: "Jan 12, 2026" },
  { id: "2", name: "Sam Okoye", email: "sam@northwind.co", role: "user", status: "active", joined: "Feb 3, 2026" },
  { id: "3", name: "Jamie Lee", email: "j.lee@blueharbor.io", role: "user", status: "invited", joined: "Mar 18, 2026" },
  { id: "4", name: "Morgan Diaz", email: "morgan@fernwoodlabs.com", role: "user", status: "disabled", joined: "Apr 2, 2026" },
  { id: "5", name: "Ken Watanabe", email: "ken@example.com", role: "user", status: "active", joined: "May 29, 2026" },
];

const STATUS_VARIANT = {
  active: "success",
  invited: "info",
  disabled: "neutral",
} as const;

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Demo data shown below — full CRUD, search, filtering, and pagination land in Phase 4.
          </p>
        </div>
        <Button disabled>Invite user</Button>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search users…" className="pl-9" disabled />
          </div>
          <Select defaultValue="" disabled className="sm:w-44">
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </Select>
          <Select defaultValue="" disabled className="sm:w-44">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>

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
              {DEMO_USERS.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link href={`/users/${user.id}`} className="block">
                      <span className="font-medium text-gray-900">{user.name}</span>
                      <span className="block text-xs text-gray-500">{user.email}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[user.status as keyof typeof STATUS_VARIANT]}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">Showing 5 of 128 users (demo)</p>
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
