"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ClaimReadinessResult } from "@/lib/types";
import { statusVariant } from "@/components/claim-readiness/utils";

export type PortfolioItem = {
  encounterId: string;
  patientName: string;
  score: number;
  status: ClaimReadinessResult["status"];
  denialRisk: number;
};

export function PortfolioList({
  items,
  selectedId,
  onSelect,
}: {
  items: PortfolioItem[];
  selectedId: string | null;
  onSelect: (encounterId: string) => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Claim portfolio</CardTitle>
        <CardDescription>Select an encounter to inspect readiness and denial risk</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[min(52vh,520px)] pr-3">
          <div className="space-y-2">
            {items.map((item, index) => {
              const selected = item.encounterId === selectedId;
              return (
                <motion.button
                  key={item.encounterId}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.03 }}
                  onClick={() => onSelect(item.encounterId)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                    selected
                      ? "border-primary/50 bg-primary/10 ring-1 ring-primary/25"
                      : "border-border/70 bg-card/40 hover:border-primary/30 hover:bg-secondary/40"
                  )}
                  aria-pressed={selected}
                  aria-label={`Select claim readiness for ${item.patientName}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.patientName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Readiness {item.score}% · Denial risk {item.denialRisk}%
                      </p>
                    </div>
                    <Badge variant={statusVariant(item.status)} className="shrink-0 capitalize">
                      {item.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
