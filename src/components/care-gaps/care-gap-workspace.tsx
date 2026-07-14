"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { CareGapMetrics } from "@/components/care-gaps/care-gap-metrics";
import { CareGapPanelList } from "@/components/care-gaps/care-gap-panel-list";
import { CareGapResultPanel } from "@/components/care-gaps/care-gap-result";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEncounterCareGaps,
  listCareGapPanel,
  runCareGapDetectionForEncounter,
} from "@/lib/services/care-gaps.service";
import type { CareGapResult, Encounter } from "@/lib/types";

type PanelData = Awaited<ReturnType<typeof listCareGapPanel>>;

export function CareGapWorkspace() {
  const [panelLoading, setPanelLoading] = useState(true);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [result, setResult] = useState<CareGapResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [selectionKey, setSelectionKey] = useState<string | null>(null);

  if (selectedId !== selectionKey) {
    setSelectionKey(selectedId);
    setEncounter(null);
    setResult(null);
    setDetailLoading(!!selectedId);
  }

  useEffect(() => {
    let mounted = true;
    listCareGapPanel()
      .then((res) => {
        if (!mounted) return;
        setPanel(res);
        const preferred =
          res.items.find((i) => i.patientName.toLowerCase().includes("john smith")) ??
          res.items[0];
        if (preferred) setSelectedId(preferred.encounterId);
      })
      .catch(() => {
        if (mounted) toast.error("Failed to load care gap panel");
      })
      .finally(() => {
        if (mounted) setPanelLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    let mounted = true;
    getEncounterCareGaps(selectedId)
      .then(({ encounter: enc, careGaps }) => {
        if (!mounted) return;
        setEncounter(enc);
        setResult(careGaps);
      })
      .catch(() => {
        if (mounted) {
          toast.error("Failed to load encounter care gaps");
          setEncounter(null);
          setResult(null);
        }
      })
      .finally(() => {
        if (mounted) setDetailLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedId]);

  const handleRunDetection = useCallback(async () => {
    if (!selectedId) return;
    setDetecting(true);
    try {
      const { encounter: enc, careGaps } = await runCareGapDetectionForEncounter(selectedId);
      setEncounter(enc);
      setResult(careGaps);
      toast.success(
        `Detected ${careGaps.gaps.length} care gap${careGaps.gaps.length === 1 ? "" : "s"} for ${enc.patientName}`
      );
      // Refresh panel metrics after a fresh run
      const refreshed = await listCareGapPanel();
      setPanel(refreshed);
    } catch {
      toast.error("Care gap detection failed");
    } finally {
      setDetecting(false);
    }
  }, [selectedId]);

  return (
    <div>
      <PageHeader
        title="AI Care Gap Detection"
        description="Panel overview of open and priority gaps with AI detection for HbA1c, eye/foot/kidney screening, vaccines, cancer screening, adherence, and lifestyle counselling."
        actions={
          <Button asChild variant="outline">
            <Link href="/encounters/new">Open Clinical Documentation</Link>
          </Button>
        }
      />

      {panelLoading || !panel ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite" aria-label="Loading care gaps">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <CareGapMetrics
            openGaps={panel.openGaps}
            priorityGaps={panel.priorityGaps}
            averageClosureRate={panel.averageClosureRate}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Care gap panel</CardTitle>
                <CardDescription>
                  Select a patient/encounter, then run AI detection from the mock panel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CareGapPanelList
                  items={panel.items}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </CardContent>
            </Card>

            <CareGapResultPanel
              encounter={encounter}
              result={result}
              loading={detailLoading}
              detecting={detecting}
              onRunDetection={handleRunDetection}
            />
          </div>
        </div>
      )}
    </div>
  );
}
