"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Droplets } from "lucide-react";
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
import type { RevenueLeakageRow } from "@/lib/services/revenue.service";
import { formatCurrency } from "@/lib/utils";

const STATUS_VARIANT: Record<
  RevenueLeakageRow["status"],
  "success" | "warning" | "destructive"
> = {
  ready: "success",
  needs_review: "warning",
  high_risk: "destructive",
};

export function RevenueLeakageTable({ rows }: { rows: RevenueLeakageRow[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.22 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4 text-warning" />
            Revenue leakage
          </CardTitle>
          <CardDescription>
            Encounter-level exposure, risk drivers, and mitigation priority
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {!rows.length ? (
            <div className="px-6 pb-6">
              <EmptyState
                icon={Droplets}
                title="No leakage exposure"
                description="Claim hygiene looks strong across the current panel."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Patient</TableHead>
                    <TableHead>Leakage</TableHead>
                    <TableHead>Claim score</TableHead>
                    <TableHead>Risk factor</TableHead>
                    <TableHead>Mitigation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.encounterId} className="group">
                      <TableCell className="font-medium">{row.patientName}</TableCell>
                      <TableCell className="tabular-nums text-warning">
                        {formatCurrency(row.leakageAmount)}
                      </TableCell>
                      <TableCell className="tabular-nums">{row.claimScore}%</TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {row.riskFactor}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">
                        {row.mitigation}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[row.status]} className="capitalize">
                          {row.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link href={`/encounters/${row.encounterId}`}>
                            Open
                            <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
