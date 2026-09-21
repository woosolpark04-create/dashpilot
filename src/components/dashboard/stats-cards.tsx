import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOverviewStats, formatCurrency, type TrendResult } from "@/lib/dashboard/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";

export async function StatsCards() {
  const supabase = await createClient();
  const { data, error } = await getOverviewStats(supabase);

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-gray-900">Statistics unavailable</p>
          <p className="mt-1 text-sm text-gray-500">
            {error?.message ?? "Something went wrong loading your dashboard statistics."}
          </p>
          {error?.code && <p className="mt-2 text-xs text-gray-400">Error code: {error.code}</p>}
        </CardContent>
      </Card>
    );
  }

  const cards = [
    { label: "Total users", icon: Users, value: data.totalUsers.value.toLocaleString(), trend: data.totalUsers.trend },
    { label: "Total leads", icon: Target, value: data.totalLeads.value.toLocaleString(), trend: data.totalLeads.trend },
    {
      label: "Active leads",
      icon: Briefcase,
      value: data.activeLeads.value.toLocaleString(),
      trend: data.activeLeads.trend,
    },
    {
      label: "Won this month",
      icon: TrendingUp,
      value: formatCurrency(data.wonThisMonth.value),
      trend: data.wonThisMonth.trend,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <StatCard key={stat.label} label={stat.label} icon={stat.icon} value={stat.value} trend={stat.trend} />
      ))}
    </div>
  );
}

function StatCard({
  label,
  icon: Icon,
  value,
  trend,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  trend: TrendResult;
}) {
  const TrendIcon = trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : ArrowRight;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
          <Icon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          {label}
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
          <Sparkline data={trend.series} trend={trend.direction} className="mb-0.5" />
        </div>
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            trend.direction === "up"
              ? "text-emerald-600"
              : trend.direction === "down"
                ? "text-red-500"
                : "text-gray-400",
          )}
        >
          <TrendIcon className="h-3 w-3" aria-hidden="true" />
          {trend.label}
        </div>
      </CardContent>
    </Card>
  );
}
