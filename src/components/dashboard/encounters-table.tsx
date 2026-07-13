"use client";

import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { Encounter } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function EncountersTable({
  encounters,
  emptyMessage = "No encounters found.",
  emptyDescription = "Create a new encounter or adjust your search filters.",
}: {
  encounters: Encounter[];
  emptyMessage?: string;
  emptyDescription?: string;
}) {
  if (!encounters.length) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={emptyMessage}
        description={emptyDescription}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/encounters/new">New Encounter</Link>
          </Button>
        }
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="glass-card overflow-hidden rounded-2xl"
    >
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Patient</TableHead>
            <TableHead>Chief complaint</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>AI conf.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {encounters.map((e) => (
            <TableRow key={e.id} className="group">
              <TableCell className="font-medium">
                <Link href={`/encounters/${e.id}`} className="hover:text-primary">
                  {e.patientName}
                </Link>
                <div className="text-xs capitalize text-muted-foreground">
                  {e.age}y · {e.gender}
                </div>
              </TableCell>
              <TableCell className="max-w-[280px] truncate text-muted-foreground">
                {e.chiefComplaint}
              </TableCell>
              <TableCell>
                <StatusBadge status={e.status} />
              </TableCell>
              <TableCell className="tabular-nums">
                {e.aiConfidence != null ? `${Math.round(e.aiConfidence)}%` : "—"}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {format(new Date(e.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm" className="gap-1">
                  <Link href={`/encounters/${e.id}`}>
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
    </motion.div>
  );
}
