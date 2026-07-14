"use client";

import { Gauge, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

export function PortfolioMetrics({
  averageScore,
  readyCount,
  reviewCount,
  highRiskCount,
}: {
  averageScore: number;
  readyCount: number;
  reviewCount: number;
  highRiskCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Avg claim readiness"
        value={`${averageScore}%`}
        icon={Gauge}
        accent="accent"
        subtitle="Portfolio readiness score"
        delay={0.02}
      />
      <KpiCard
        title="Ready to submit"
        value={readyCount}
        icon={ShieldCheck}
        accent="success"
        subtitle="Claims at submission quality"
        delay={0.05}
      />
      <KpiCard
        title="Needs review"
        value={reviewCount}
        icon={ShieldQuestion}
        accent="warning"
        subtitle="Documentation or coding gaps"
        delay={0.08}
      />
      <KpiCard
        title="High denial risk"
        value={highRiskCount}
        icon={ShieldAlert}
        accent="warning"
        subtitle="Priority denial prevention"
        delay={0.11}
      />
    </div>
  );
}
