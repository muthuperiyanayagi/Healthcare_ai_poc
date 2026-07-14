"use client";

import { Activity, AlertTriangle, HeartPulse, Target } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

export function CareGapMetrics({
  openGaps,
  priorityGaps,
  averageClosureRate,
}: {
  openGaps: number;
  priorityGaps: number;
  averageClosureRate: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Open gaps"
        value={openGaps}
        subtitle="Across today's care gap panel"
        icon={HeartPulse}
        accent="primary"
        delay={0}
      />
      <KpiCard
        title="Priority gaps"
        value={priorityGaps}
        subtitle="Critical or high severity"
        icon={AlertTriangle}
        accent="warning"
        delay={0.05}
      />
      <KpiCard
        title="Avg closure rate"
        value={`${averageClosureRate}%`}
        subtitle="Panel quality measure progress"
        icon={Target}
        accent="success"
        delay={0.1}
      />
      <KpiCard
        title="Detection mode"
        value="AI live"
        subtitle="detectCareGaps · panel + run"
        icon={Activity}
        accent="accent"
        delay={0.15}
      />
    </div>
  );
}
