import { Suspense } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatsCardsSkeleton } from "@/components/dashboard/stats-cards-skeleton";
import { RecentLeadsCard } from "@/components/dashboard/recent-leads-card";
import { RecentLeadsSkeleton } from "@/components/dashboard/recent-leads-skeleton";

export default function OverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">A snapshot of what&apos;s happening across your workspace.</p>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<RecentLeadsSkeleton />}>
        <RecentLeadsCard />
      </Suspense>
    </div>
  );
}
