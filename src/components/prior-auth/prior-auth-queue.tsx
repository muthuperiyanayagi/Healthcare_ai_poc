"use client";

import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PriorAuthStatus } from "@/lib/types";

const STATUS_LABEL: Record<PriorAuthStatus, string> = {
  not_required: "Not required",
  likely_required: "Likely required",
  submitted: "Submitted",
  approved: "Approved",
  denied: "Denied",
};

const STATUS_VARIANT: Record<
  PriorAuthStatus,
  "success" | "warning" | "secondary" | "accent" | "destructive"
> = {
  not_required: "success",
  likely_required: "warning",
  submitted: "accent",
  approved: "success",
  denied: "destructive",
};

export type PriorAuthQueueItem = {
  encounterId: string;
  patientName: string;
  status: PriorAuthStatus;
  required: boolean;
  summary: string;
  turnaroundDays: number;
};

export function PriorAuthQueue({
  items,
  onAssessEncounter,
}: {
  items: PriorAuthQueueItem[];
  onAssessEncounter?: (item: PriorAuthQueueItem) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck2 className="h-4 w-4 text-primary" />
          Prior auth queue
        </CardTitle>
        <CardDescription>
          Active encounters ranked by prior-authorization likelihood and documentation readiness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No encounters in the prior auth queue.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.encounterId}
              className="flex flex-col gap-2 rounded-xl border border-border/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.patientName}</p>
                <p className="text-xs text-muted-foreground">{item.summary}</p>
                {item.turnaroundDays > 0 ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Est. turnaround ~{item.turnaroundDays} business days
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[item.status]}>
                  {STATUS_LABEL[item.status]}
                </Badge>
                {onAssessEncounter ? (
                  <Button size="sm" variant="secondary" onClick={() => onAssessEncounter(item)}>
                    Assess
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="outline">
                  <Link href={`/encounters/${item.encounterId}`}>View</Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
