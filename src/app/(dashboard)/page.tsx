import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Briefcase, Target, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";

// Static demo content only — real aggregate queries land in Phase 3.
const STATS = [
  {
    label: "Total users",
    value: "128",
    delta: "+8.2%",
    trend: "up" as const,
    icon: Users,
    series: [88, 94, 97, 103, 110, 118, 128],
  },
  {
    label: "Total leads",
    value: "42",
    delta: "+12.4%",
    trend: "up" as const,
    icon: Target,
    series: [24, 27, 29, 33, 35, 38, 42],
  },
  {
    label: "Active leads",
    value: "17",
    delta: "-3.1%",
    trend: "down" as const,
    icon: Briefcase,
    series: [21, 20, 22, 19, 18, 19, 17],
  },
  {
    label: "Won this month",
    value: "$12,400",
    delta: "+21.0%",
    trend: "up" as const,
    icon: TrendingUp,
    series: [6200, 7100, 8400, 9000, 9800, 11200, 12400],
  },
];

const RECENT_LEADS = [
  { name: "Acme Robotics", contact: "priya@acmerobotics.dev", status: "qualified" as const, value: "$4,200", updated: "2h ago" },
  { name: "Northwind Traders", contact: "sam@northwind.co", status: "new" as const, value: "$1,800", updated: "5h ago" },
  { name: "Blue Harbor Studio", contact: "j.lee@blueharbor.io", status: "contacted" as const, value: "$6,500", updated: "1d ago" },
  { name: "Fernwood Labs", contact: "hello@fernwoodlabs.com", status: "won" as const, value: "$9,000", updated: "2d ago" },
];

const STATUS_VARIANT = {
  new: "info",
  contacted: "neutral",
  qualified: "warning",
  won: "success",
  lost: "danger",
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">A snapshot of what&apos;s happening across your workspace.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <stat.icon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                  {stat.label}
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold tracking-tight text-gray-900">{stat.value}</p>
                  <Sparkline data={stat.series} trend={stat.trend} className="mb-0.5" />
                </div>
                <div
                  className={cn(
                    "mt-2 flex items-center gap-1 text-xs font-medium",
                    stat.trend === "up" ? "text-emerald-600" : "text-red-500",
                  )}
                >
                  <TrendIcon className="h-3 w-3" aria-hidden="true" />
                  {stat.delta}
                  <span className="font-normal text-gray-400">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent leads</CardTitle>
          <Link
            href="/leads"
            className="flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent className="mt-3 divide-y divide-gray-100 p-0">
          {RECENT_LEADS.map((lead) => (
            <div
              key={lead.name}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50/70"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  {initials(lead.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{lead.name}</p>
                  <p className="truncate text-xs text-gray-500">{lead.contact}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden text-xs text-gray-400 sm:block">{lead.updated}</span>
                <Badge variant={STATUS_VARIANT[lead.status]} dot>
                  {lead.status}
                </Badge>
                <span className="w-16 text-right text-sm font-medium tabular-nums text-gray-900">
                  {lead.value}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
