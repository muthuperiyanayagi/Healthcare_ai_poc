"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExecutiveSummary } from "@/lib/types";

export function ExecutiveSummaryCard({
  summary,
  sourceEncounterId,
  loading,
}: {
  summary: ExecutiveSummary | null;
  sourceEncounterId?: string | null;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.18 }}
    >
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary via-accent to-success" />
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" />
                Executive AI summary
              </CardTitle>
              <CardDescription className="mt-1">
                Portfolio narrative synthesized from clinical, coding, and revenue signals
              </CardDescription>
            </div>
            <Badge variant="accent">AI RCM</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading || !summary ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading executive summary">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {summary.headline}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {summary.narrative}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <HighlightBlock title="Clinical" items={summary.clinicalHighlights} />
                <HighlightBlock title="Coding" items={summary.codingHighlights} />
                <HighlightBlock title="Revenue" items={summary.revenueHighlights} />
              </div>

              <div className="rounded-xl border border-border/70 bg-secondary/25 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action items
                </p>
                <ul className="space-y-2">
                  {summary.actionItems.map((item) => (
                    <li key={item} className="flex gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {sourceEncounterId ? (
                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/encounters/${sourceEncounterId}`}>View source encounter</Link>
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HighlightBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card-solid/40 p-3 backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="text-sm leading-snug text-foreground/90">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
