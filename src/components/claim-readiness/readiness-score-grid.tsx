"use client";

import { motion } from "framer-motion";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClaimReadinessResult } from "@/lib/types";
import { type ClaimScoreBreakdown, statusVariant } from "@/components/claim-readiness/utils";

export function ReadinessScoreGrid({
  scores,
  status,
  summary,
}: {
  scores: ClaimScoreBreakdown;
  status: ClaimReadinessResult["status"];
  summary?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Claim readiness scores</CardTitle>
            <CardDescription>
              Medical necessity, coding support, and documentation completeness
            </CardDescription>
          </div>
          <Badge variant={statusVariant(status)} className="capitalize">
            {status.replaceAll("_", " ")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <ScoreGauge label="Claim readiness" value={scores.claimReadiness} />
            <ScoreGauge label="Medical necessity" value={scores.medicalNecessity} />
            <ScoreGauge label="Diagnosis support" value={scores.diagnosisSupport} />
            <ScoreGauge label="Procedure support" value={scores.procedureSupport} />
            <ScoreGauge label="Documentation completeness" value={scores.documentationCompleteness} />
          </div>
          {summary ? (
            <p className="rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
              {summary}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
