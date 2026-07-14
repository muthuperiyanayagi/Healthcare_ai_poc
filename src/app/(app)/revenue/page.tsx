"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { RevenueCommandSkeleton } from "@/components/revenue/revenue-command-skeleton";
import { RevenueKpiGrid } from "@/components/revenue/revenue-kpi-grid";
import { RevenueCharts } from "@/components/revenue/revenue-charts";
import { RevenueLeakageTable } from "@/components/revenue/revenue-leakage-table";
import { ClaimIntelligenceTable } from "@/components/revenue/claim-intelligence-table";
import { ExecutiveSummaryCard } from "@/components/revenue/executive-summary-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRevenueCommandCenter,
  getRevenueExecutiveSummary,
  runEncounterRevenuePrediction,
  type RevenueCommandCenter,
} from "@/lib/services/revenue.service";
import type { ExecutiveSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<RevenueCommandCenter | null>(null);
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [summarySourceId, setSummarySourceId] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [predictingId, setPredictingId] = useState<string | null>(null);

  async function loadCommandCenter(opts?: { soft?: boolean }) {
    if (opts?.soft) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getRevenueCommandCenter();
      setData(res);
    } catch {
      toast.error("Failed to load revenue command center");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadExecutiveSummary() {
    setSummaryLoading(true);
    try {
      const res = await getRevenueExecutiveSummary();
      setSummary(res.summary);
      setSummarySourceId(res.sourceEncounterId);
    } catch {
      toast.error("Failed to generate executive AI summary");
    } finally {
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [command, exec] = await Promise.all([
          getRevenueCommandCenter(),
          getRevenueExecutiveSummary(),
        ]);
        if (!mounted) return;
        setData(command);
        setSummary(exec.summary);
        setSummarySourceId(exec.sourceEncounterId);
      } catch {
        if (mounted) toast.error("Failed to load revenue command center");
      } finally {
        if (mounted) {
          setLoading(false);
          setSummaryLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function handlePredict(encounterId: string) {
    setPredictingId(encounterId);
    try {
      const prediction = await runEncounterRevenuePrediction(encounterId);
      toast.success(
        `Prediction ready · ${formatCurrency(prediction.expectedReimbursement)} expected · ${formatCurrency(prediction.revenueAtRisk)} at risk`
      );
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          claimIntelligence: prev.claimIntelligence.map((row) =>
            row.encounterId === encounterId
              ? {
                  ...row,
                  expectedReimbursement: prediction.expectedReimbursement,
                  revenueProtected: prediction.revenueProtected,
                  revenueAtRisk: prediction.revenueAtRisk,
                }
              : row
          ),
          leakageItems: prev.leakageItems.map((row) =>
            row.encounterId === encounterId
              ? { ...row, leakageAmount: prediction.revenueAtRisk }
              : row
          ),
        };
      });
    } catch {
      toast.error("Revenue prediction failed");
    } finally {
      setPredictingId(null);
    }
  }

  async function handleRefresh() {
    toast.message("Refreshing revenue command center…");
    await Promise.all([loadCommandCenter({ soft: true }), loadExecutiveSummary()]);
    toast.success("Command center updated");
  }

  return (
    <div>
      <PageHeader
        title="AI Revenue Cycle Command Center"
        description="Executive view of claim readiness, protected revenue, leakage exposure, and encounter-level reimbursement intelligence."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/encounters/new">
                <Sparkles className="h-4 w-4" />
                New Encounter
              </Link>
            </Button>
          </div>
        }
      />

      {loading || !data ? (
        <RevenueCommandSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <RevenueKpiGrid data={data} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat
              label="First-pass yield"
              value={`${data.kpis.firstPassYield}%`}
              delay={0.08}
            />
            <MiniStat
              label="Net collections"
              value={`${data.kpis.netCollectionsRate}%`}
              delay={0.1}
            />
            <MiniStat label="Days in A/R" value={String(data.kpis.daysInAR)} delay={0.12} />
            <MiniStat
              label="Denial rate"
              value={`${data.kpis.denialRate}%`}
              delay={0.14}
            />
          </div>

          <RevenueCharts trends={data.trends} qualityTrends={data.qualityTrends} />

          <ExecutiveSummaryCard
            summary={summary}
            sourceEncounterId={summarySourceId}
            loading={summaryLoading}
          />

          <RevenueLeakageTable rows={data.leakageItems} />

          <ClaimIntelligenceTable
            rows={data.claimIntelligence}
            predictingId={predictingId}
            onPredict={handlePredict}
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.32 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" />
                  Top opportunities
                </CardTitle>
                <CardDescription>
                  Highest at-risk encounters ranked for revenue intervention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topOpportunities.map((item) => (
                  <div
                    key={item.encounterId}
                    className="flex flex-col gap-2 rounded-xl border border-border/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        Claim score {item.claimScore}% · Protected{" "}
                        {formatCurrency(item.revenueProtected)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-warning">
                        At risk {formatCurrency(item.revenueAtRisk)}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/encounters/${item.encounterId}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  delay = 0,
}: {
  label: string;
  value: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="font-display text-xl tabular-nums">{value}</CardTitle>
        </CardHeader>
      </Card>
    </motion.div>
  );
}
