"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Lightbulb,
  Percent,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClaimReadinessResult, DenialRiskPrediction } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

function InsightList({
  items,
  empty,
  tone = "default",
}: {
  items: string[];
  empty: string;
  tone?: "default" | "warning" | "success";
}) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-lg border px-3 py-2 text-sm ${
            tone === "warning"
              ? "border-warning/30 bg-warning/5"
              : tone === "success"
                ? "border-success/30 bg-success/5"
                : "border-border/70 bg-card/50"
          }`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ReadinessInsights({
  claim,
  denial,
  codingErrors,
  approvalProbability,
}: {
  claim: ClaimReadinessResult;
  denial: DenialRiskPrediction;
  codingErrors: string[];
  approvalProbability: number;
}) {
  const denialReasons = denial.topDenialReasons.map(
    (r) => `${r.reason} (${r.contribution}% contribution)`
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="grid gap-4 lg:grid-cols-2"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileWarning className="h-4 w-4 text-warning" />
            Missing documentation
          </CardTitle>
          <CardDescription>Elements that should be closed before claim submit</CardDescription>
        </CardHeader>
        <CardContent>
          <InsightList
            items={claim.missingElements}
            empty="No critical documentation gaps identified."
            tone="warning"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Coding errors
          </CardTitle>
          <CardDescription>Warnings and unsupported coding patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <InsightList
            items={codingErrors}
            empty="No coding errors flagged for this encounter."
            tone="warning"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Potential denial reasons
          </CardTitle>
          <CardDescription>Top predicted denial drivers from AI risk model</CardDescription>
        </CardHeader>
        <CardContent>
          <InsightList items={denialReasons} empty="No elevated denial drivers detected." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-4 w-4 text-success" />
              Estimated approval probability
            </CardTitle>
            <CardDescription>Derived from claim readiness and denial risk</CardDescription>
          </div>
          <Badge variant="success" className="text-sm">
            {formatPercent(approvalProbability)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/5 px-3 py-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Denial risk {denial.overallRisk}% · Model confidence {denial.confidence}%
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-accent" />
              AI recommendations
            </p>
            <InsightList
              items={claim.recommendations}
              empty="No additional AI recommendations."
              tone="success"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
