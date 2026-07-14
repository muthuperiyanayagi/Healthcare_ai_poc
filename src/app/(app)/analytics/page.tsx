"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalyticsSeries } from "@/lib/services/analytics.service";
import type { AnalyticsSeries } from "@/lib/types";

export default function AnalyticsPage() {
  const [series, setSeries] = useState<AnalyticsSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAnalyticsSeries()
      .then((data) => {
        if (mounted) setSeries(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Interactive trends for encounters, coding accuracy, time saved, revenue, claim readiness, and documentation quality."
      />
      {loading || !series ? (
        <div
          className="grid gap-4 lg:grid-cols-2"
          aria-busy="true"
          aria-live="polite"
          aria-label="Loading analytics"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <AnalyticsCharts series={series} />
      )}
    </div>
  );
}
