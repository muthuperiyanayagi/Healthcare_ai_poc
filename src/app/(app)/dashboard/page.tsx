"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ClipboardCheck,
  Clock3,
  DollarSign,
  FileText,
  Gauge,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { WeeklyCharts } from "@/components/dashboard/weekly-charts";
import { EncountersTable } from "@/components/dashboard/encounters-table";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardMetrics } from "@/lib/services/analytics.service";
import { getRecentEncounters } from "@/lib/services/encounter.service";
import type { DashboardMetrics, Encounter, WeeklyPoint } from "@/lib/types";
import { formatCurrency, formatMinutes, formatPercent } from "@/lib/utils";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [weekly, setWeekly] = useState<WeeklyPoint[]>([]);
  const [recent, setRecent] = useState<Encounter[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [dash, recentEncounters] = await Promise.all([
          getDashboardMetrics(),
          getRecentEncounters(8),
        ]);
        if (!mounted) return;
        setMetrics(dash.metrics);
        setWeekly(dash.weekly);
        setRecent(recentEncounters);
      } catch {
        if (mounted) toast.error("Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Clinical Dashboard"
        description="Real-time documentation quality, coding accuracy, claim readiness, and revenue protection across today's panel."
        actions={
          <Button asChild>
            <Link href="/encounters/new">
              <Sparkles className="h-4 w-4" />
              New Encounter
            </Link>
          </Button>
        }
      />

      {loading || !metrics ? (
        <DashboardSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              title="Patients Today"
              value={metrics.patientsToday}
              icon={Users}
              subtitle="Active clinic panel"
              delay={0.02}
            />
            <KpiCard
              title="SOAP Notes"
              value={metrics.aiNotesGenerated}
              icon={FileText}
              accent="accent"
              subtitle="AI clinical notes generated"
              delay={0.04}
            />
            <KpiCard
              title="Time Saved"
              value={formatMinutes(metrics.timeSavedMinutes)}
              icon={Clock3}
              accent="success"
              subtitle="Clinician documentation"
              delay={0.06}
            />
            <KpiCard
              title="Coding Accuracy"
              value={formatPercent(metrics.codingAccuracy, 1)}
              icon={ClipboardCheck}
              subtitle="Suggested code confidence"
              delay={0.08}
            />
            <KpiCard
              title="Claim Readiness"
              value={formatPercent(metrics.claimReadiness, 1)}
              icon={Gauge}
              accent="accent"
              subtitle="Billing completeness"
              delay={0.1}
            />
            <KpiCard
              title="Revenue Protected"
              value={formatCurrency(metrics.revenueProtected ?? metrics.revenueLeakagePrevented)}
              icon={TrendingUp}
              accent="success"
              subtitle="AI coding defense (MTD)"
              delay={0.12}
            />
            <KpiCard
              title="Revenue Leakage"
              value={formatCurrency(metrics.revenueLeakage ?? 0)}
              icon={DollarSign}
              accent="warning"
              subtitle="Remaining exposure (MTD)"
              delay={0.14}
            />
            <KpiCard
              title="Denial Risk"
              value={formatPercent(metrics.denialRisk ?? 0, 1)}
              icon={ShieldAlert}
              accent="warning"
              subtitle="Avg predicted denial risk"
              delay={0.16}
            />
            <KpiCard
              title="Care Gap Closure"
              value={formatPercent(metrics.careGapClosure ?? 0, 1)}
              icon={HeartPulse}
              accent="accent"
              subtitle="Quality measure progress"
              delay={0.18}
            />
            <KpiCard
              title="Clinical Productivity"
              value={formatPercent(metrics.clinicalProductivity ?? 0, 1)}
              icon={Activity}
              subtitle="Provider productivity index"
              delay={0.2}
            />
          </div>

          <WeeklyCharts data={weekly} />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-base">Recent Encounters</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href="/encounters">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <EncountersTable encounters={recent} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
