"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { ClaimIntelligenceRow } from "@/lib/services/revenue.service";
import { formatCurrency } from "@/lib/utils";

const STATUS_VARIANT: Record<
  ClaimIntelligenceRow["status"],
  "success" | "warning" | "destructive"
> = {
  ready: "success",
  needs_review: "warning",
  high_risk: "destructive",
};

export function ClaimIntelligenceTable({
  rows,
  predictingId,
  onPredict,
}: {
  rows: ClaimIntelligenceRow[];
  predictingId?: string | null;
  onPredict?: (encounterId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.28 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BrainCircuit className="h-4 w-4 text-primary" />
            Claim intelligence
          </CardTitle>
          <CardDescription>
            Coding accuracy, readiness, reimbursement, and denial risk by encounter
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {!rows.length ? (
            <div className="px-6 pb-6">
              <EmptyState
                icon={BrainCircuit}
                title="No claim intelligence yet"
                description="Generate AI documentation on encounters to populate this table."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/encounters/new">New Encounter</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Patient</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Readiness</TableHead>
                    <TableHead>Reimbursement</TableHead>
                    <TableHead>Protected</TableHead>
                    <TableHead>At risk</TableHead>
                    <TableHead>Denial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const busy = predictingId === row.encounterId;
                    return (
                      <TableRow key={row.encounterId} className="group">
                        <TableCell>
                          <Link
                            href={`/encounters/${row.encounterId}`}
                            className="font-medium hover:text-primary"
                          >
                            {row.patientName}
                          </Link>
                          <div className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {row.chiefComplaint}
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">{row.codingAccuracy}%</TableCell>
                        <TableCell className="tabular-nums">{row.claimReadiness}%</TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(row.expectedReimbursement)}
                        </TableCell>
                        <TableCell className="tabular-nums text-success">
                          {formatCurrency(row.revenueProtected)}
                        </TableCell>
                        <TableCell className="tabular-nums text-warning">
                          {formatCurrency(row.revenueAtRisk)}
                        </TableCell>
                        <TableCell className="tabular-nums">{row.denialRisk}%</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[row.status]} className="capitalize">
                            {row.status.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onPredict ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => onPredict(row.encounterId)}
                              >
                                {busy ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Predicting
                                  </>
                                ) : (
                                  "Predict"
                                )}
                              </Button>
                            ) : null}
                            <Button asChild variant="ghost" size="sm" className="gap-1">
                              <Link href={`/encounters/${row.encounterId}`}>
                                Open
                                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
