"use client";

import { motion } from "framer-motion";
import { Check, ShieldAlert, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DenialRiskPrediction } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  flagTaxonomyReasons,
  riskLabel,
  riskVariant,
} from "@/components/claim-readiness/utils";

export function DenialPreventionPanel({
  denial,
  missingElements,
}: {
  denial: DenialRiskPrediction;
  missingElements: string[];
}) {
  const taxonomy = flagTaxonomyReasons(denial.topDenialReasons, missingElements);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-warning" />
              Denial prevention
            </CardTitle>
            <CardDescription>{denial.summary}</CardDescription>
          </div>
          <Badge variant={riskVariant(denial.riskLevel)} className="w-fit text-sm">
            Denial risk: {riskLabel(denial.riskLevel)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">Common denial reasons</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {taxonomy.map((item) => (
                <div
                  key={item.reason}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm",
                    item.active
                      ? "border-warning/35 bg-warning/8"
                      : "border-border/60 bg-secondary/20 text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      item.active ? "bg-warning/20 text-warning" : "bg-success/15 text-success"
                    )}
                  >
                    {item.active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0">
                    <p className={cn("font-medium", item.active && "text-foreground")}>
                      {item.reason}
                    </p>
                    {item.active && item.detail ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-accent" />
              AI suggestions
            </p>
            <ul className="space-y-2">
              {denial.mitigationActions.map((action) => (
                <li
                  key={action}
                  className="rounded-xl border border-accent/25 bg-accent/5 px-3 py-2 text-sm"
                >
                  {action}
                </li>
              ))}
              {denial.topDenialReasons.map((factor) => (
                <li
                  key={factor.id}
                  className="rounded-xl border border-border/70 bg-card/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{factor.reason}</span>
                  <span className="text-muted-foreground"> — {factor.mitigation}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
