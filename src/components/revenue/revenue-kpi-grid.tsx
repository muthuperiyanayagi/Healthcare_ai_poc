"use client";

import {
  ClipboardCheck,
  DollarSign,
  FileCheck2,
  FileWarning,
  Gauge,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import type { RevenueCommandCenter } from "@/lib/services/revenue.service";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function RevenueKpiGrid({ data }: { data: RevenueCommandCenter }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiCard
        title="Claims Today"
        value={data.claimsToday}
        icon={FileCheck2}
        subtitle="Encounters in revenue workflow"
        delay={0.02}
      />
      <KpiCard
        title="Claims Ready"
        value={data.claimsReady}
        icon={ShieldCheck}
        accent="success"
        subtitle="Score ≥ 88% claim hygiene"
        delay={0.04}
      />
      <KpiCard
        title="Claims At Risk"
        value={data.claimsAtRisk}
        icon={FileWarning}
        accent="warning"
        subtitle="Needs review or high risk"
        delay={0.06}
      />
      <KpiCard
        title="Revenue Protected"
        value={formatCurrency(data.protectedMtd)}
        icon={TrendingUp}
        accent="success"
        subtitle="AI coding defense (MTD)"
        delay={0.08}
      />
      <KpiCard
        title="Revenue Leakage"
        value={formatCurrency(data.leakageMtd)}
        icon={TrendingDown}
        accent="warning"
        subtitle="Remaining exposure (MTD)"
        delay={0.1}
      />
      <KpiCard
        title="Average Coding Accuracy"
        value={formatPercent(data.averageCodingAccuracy, 1)}
        icon={ClipboardCheck}
        subtitle="Suggested code confidence"
        delay={0.12}
      />
      <KpiCard
        title="Average Claim Readiness"
        value={formatPercent(data.averageClaimReadiness, 1)}
        icon={Gauge}
        accent="accent"
        subtitle="Billing completeness"
        delay={0.14}
      />
      <KpiCard
        title="Estimated Reimbursement"
        value={formatCurrency(data.estimatedReimbursement)}
        icon={DollarSign}
        accent="accent"
        subtitle="Expected collections pipeline"
        delay={0.16}
      />
      <KpiCard
        title="Documentation Quality"
        value={formatPercent(data.documentationQuality, 1)}
        icon={Sparkles}
        subtitle="AI clinical note quality"
        delay={0.18}
      />
    </div>
  );
}
