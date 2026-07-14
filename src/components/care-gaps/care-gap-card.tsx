"use client";

import { motion } from "framer-motion";
import { CalendarClock, ClipboardList, FlaskConical, Lightbulb } from "lucide-react";
import type { CareGap } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { CareGapPriorityBadge } from "@/components/care-gaps/care-gap-priority-badge";
import { cn } from "@/lib/utils";

function formatDue(dueBy?: string): string {
  if (!dueBy) return "Not set";
  if (/^\d{4}-\d{2}-\d{2}/.test(dueBy)) {
    const d = new Date(dueBy);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
  return dueBy;
}

const SEVERITY_BORDER: Record<CareGap["severity"], string> = {
  critical: "border-l-destructive/80",
  warning: "border-l-warning/80",
  info: "border-l-accent/70",
};

export function CareGapCard({ gap, index = 0 }: { gap: CareGap; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.24) }}
      className={cn(
        "rounded-xl border border-border/70 border-l-4 bg-card/60 p-4",
        SEVERITY_BORDER[gap.severity]
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className="font-display text-sm font-semibold tracking-tight md:text-base">
            {gap.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <CareGapPriorityBadge severity={gap.severity} />
            <Badge variant="outline" className="capitalize">
              {gap.category.replaceAll("_", " ")}
            </Badge>
            {gap.measureId ? (
              <Badge variant="secondary" className="font-mono text-[10px]">
                {gap.measureId}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span>
            Due <span className="font-medium text-foreground">{formatDue(gap.dueBy)}</span>
          </span>
        </div>
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-secondary/30 p-3">
          <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" />
            Evidence
          </dt>
          <dd className="text-sm leading-relaxed text-foreground/90">{gap.detail}</dd>
        </div>
        <div className="rounded-lg bg-secondary/30 p-3">
          <dt className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5" />
            Recommended action
          </dt>
          <dd className="text-sm leading-relaxed text-foreground/90">{gap.recommendedAction}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
        <ClipboardList className="h-3.5 w-3.5" />
        Priority · Evidence · Action · Due date
      </div>
    </motion.article>
  );
}
