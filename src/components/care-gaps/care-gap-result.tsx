"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeartPulse, Loader2, Sparkles } from "lucide-react";
import type { CareGapResult, Encounter } from "@/lib/types";
import { CareGapCard } from "@/components/care-gaps/care-gap-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { Skeleton } from "@/components/ui/skeleton";

export function CareGapResultPanel({
  encounter,
  result,
  loading,
  detecting,
  onRunDetection,
}: {
  encounter: Encounter | null;
  result: CareGapResult | null;
  loading?: boolean;
  detecting?: boolean;
  onRunDetection: () => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!encounter) {
    return (
      <EmptyState
        icon={HeartPulse}
        title="Select a patient from the panel"
        description="Choose an encounter to review open care gaps, evidence, and recommended actions — or run AI detection."
      />
    );
  }

  const sortedGaps = result
    ? [...result.gaps].sort((a, b) => {
        const rank = { critical: 0, warning: 1, info: 2 } as const;
        return rank[a.severity] - rank[b.severity];
      })
    : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4 border-b border-border/60 bg-secondary/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex flex-wrap items-center gap-2 font-display text-lg">
              <HeartPulse className="h-5 w-5 text-primary" />
              {encounter.patientName}
            </CardTitle>
            <CardDescription className="mt-1">
              {encounter.age}y · {encounter.gender} · {encounter.chiefComplaint}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRunDetection} disabled={detecting} size="sm">
              {detecting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Detecting…
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Run AI detection
                </>
              )}
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/encounters/${encounter.id}`}>Open encounter</Link>
            </Button>
          </div>
        </div>

        {result ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <div className="rounded-xl border border-border/70 bg-card/50 px-3 py-3">
              <ScoreGauge label="Closure rate" value={result.closureRate} />
            </div>
            <div className="rounded-xl border border-border/70 bg-card/50 px-3 py-3">
              <p className="text-xs text-muted-foreground">Open gaps</p>
              <p className="font-display text-2xl font-semibold tabular-nums">{result.gaps.length}</p>
              <Progress value={Math.min(100, result.gaps.length * 12)} className="mt-2" />
            </div>
            <div className="rounded-xl border border-border/70 bg-card/50 px-3 py-3">
              <p className="text-xs text-muted-foreground">Priority gaps</p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {result.priorityCount}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="warning">{result.priorityCount} high/critical</Badge>
                <Badge variant="secondary">
                  {result.gaps.length - result.priorityCount} routine
                </Badge>
              </div>
            </div>
          </motion.div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {detecting && !result ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : null}

        {result ? (
          <>
            <div className="rounded-xl border border-border/70 bg-primary/5 px-3 py-3 text-sm leading-relaxed">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                AI summary
              </p>
              {result.summary}
            </div>

            {sortedGaps.length === 0 ? (
              <EmptyState
                title="No open care gaps"
                description="AI did not detect actionable gaps for this encounter."
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Detected gaps</h3>
                  <p className="text-xs text-muted-foreground">
                    Priority · Evidence · Recommended action · Due date
                  </p>
                </div>
                {sortedGaps.map((gap, i) => (
                  <CareGapCard key={gap.id} gap={gap} index={i} />
                ))}
              </div>
            )}
          </>
        ) : !detecting ? (
          <EmptyState
            icon={Sparkles}
            title="Run care gap detection"
            description="Use AI detection to surface HbA1c, eye/foot/kidney screening, vaccines, cancer screening, adherence, and lifestyle gaps for this patient."
            action={
              <Button onClick={onRunDetection} size="sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Run AI detection
              </Button>
            }
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
