"use client";

import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CareGapPriorityBadge } from "@/components/care-gaps/care-gap-priority-badge";
import { cn } from "@/lib/utils";
import type { CdsSeverity } from "@/lib/types";

export type CareGapPanelItem = {
  encounterId: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  gapCount: number;
  priorityCount: number;
  closureRate: number;
  topGap: string;
  topSeverity: CdsSeverity | null;
};

export function CareGapPanelList({
  items,
  selectedId,
  onSelect,
}: {
  items: CareGapPanelItem[];
  selectedId: string | null;
  onSelect: (encounterId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const selected = item.encounterId === selectedId;
        const isJohn = item.patientName.toLowerCase().includes("john smith");
        return (
          <motion.button
            key={item.encounterId}
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2) }}
            onClick={() => onSelect(item.encounterId)}
            className={cn(
              "flex w-full flex-col gap-2 rounded-xl border px-3 py-3 text-left transition-colors",
              selected
                ? "border-primary/50 bg-primary/8 shadow-sm"
                : "border-border/70 bg-card/40 hover:border-border hover:bg-secondary/40"
            )}
            aria-pressed={selected}
            aria-label={`Select care gaps for ${item.patientName}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                >
                  <UserRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.patientName}
                    {isJohn ? (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Diabetes demo
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.age}y · {item.gender} · {item.chiefComplaint}
                  </p>
                </div>
              </div>
              {item.topSeverity ? <CareGapPriorityBadge severity={item.topSeverity} /> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-10">
              <Badge variant="outline" className="text-[10px]">
                {item.gapCount} gap{item.gapCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {item.priorityCount} priority
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                Closure {item.closureRate}%
              </span>
            </div>
            <p className="line-clamp-1 pl-10 text-xs text-muted-foreground">{item.topGap}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
