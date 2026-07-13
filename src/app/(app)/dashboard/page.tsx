"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  ClipboardCheck,
  Clock3,
  DollarSign,
  FileText,
  Gauge,
  Sparkles,
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
        description="Real-time documentation quality, coding accuracy, and claim readiness across today's panel."
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Patients Today"
              value={metrics.patientsToday}
              icon={Users}
              subtitle="Active clinic panel"
              delay={0.02}
            />
            <KpiCard
              title="AI Notes Generated"
              value={metrics.aiNotesGenerated}
              icon={FileText}
              accent="accent"
              subtitle="Documented with AI"
              delay={0.05}
            />
            <KpiCard
              title="Time Saved"
              value={formatMinutes(metrics.timeSavedMinutes)}
              icon={Clock3}
              accent="success"
              subtitle="Clinician documentation"
              delay={0.08}
            />
            <KpiCard
              title="Coding Accuracy"
              value={formatPercent(metrics.codingAccuracy, 1)}
              icon={ClipboardCheck}
              subtitle="Suggested code confidence"
              delay={0.11}
            />
            <KpiCard
              title="Claim Readiness"
              value={formatPercent(metrics.claimReadiness, 1)}
              icon={Gauge}
              accent="accent"
              subtitle="Billing completeness"
              delay={0.14}
            />
            <KpiCard
              title="Documentation Quality"
              value={formatPercent(metrics.documentationQuality, 1)}
              icon={Brain}
              accent="success"
              subtitle="SOAP completeness score"
              delay={0.17}
            />
            <KpiCard
              title="AI Confidence"
              value={formatPercent(metrics.aiConfidence, 1)}
              icon={Sparkles}
              subtitle="Model certainty average"
              delay={0.2}
            />
            <KpiCard
              title="Revenue Leakage Prevented"
              value={formatCurrency(metrics.revenueLeakagePrevented)}
              icon={DollarSign}
              accent="warning"
              subtitle="Under-coding recovery (MTD)"
              delay={0.23}
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
