"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Download, FileQuestion, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { EmptyState } from "@/components/shared/empty-state";
import { AiOutputPanels } from "@/components/encounter/ai-output-panels";
import { EncounterPrintReport } from "@/components/encounter/encounter-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEncounter, patchEncounter } from "@/lib/services/encounter.service";
import { downloadJson, exportFhirBundle } from "@/lib/services/fhir.service";
import type { AiGenerationResult, Encounter } from "@/lib/types";

export default function EncounterDetailPage() {
  const params = useParams<{ id: string }>();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState(params.id);

  if (params.id !== activeId) {
    setActiveId(params.id);
    setLoading(true);
    setError(null);
    setEncounter(null);
  }

  useEffect(() => {
    let cancelled = false;
    getEncounter(params.id)
      .then((data) => {
        if (!cancelled) setEncounter(data);
      })
      .catch(() => {
        if (!cancelled) {
          setEncounter(null);
          setError("Encounter not found.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleFhir() {
    if (!encounter) return;
    setExporting(true);
    try {
      const bundle = await exportFhirBundle(encounter);
      const slug = encounter.patientName.replace(/\s+/g, "-").toLowerCase() || "encounter";
      downloadJson(`fhir-${slug}-${encounter.id}.json`, bundle);
      const updated = await patchEncounter(encounter.id, { status: "exported" });
      setEncounter(updated);
      toast.success("FHIR Bundle downloaded");
    } catch {
      toast.error("FHIR export failed");
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!encounter || error) {
    return (
      <EmptyState
        icon={FileQuestion}
        title={error ?? "Encounter not found"}
        description="This encounter may have been removed or the link is invalid."
        action={
          <Button asChild variant="outline">
            <Link href="/encounters">
              <ArrowLeft className="h-4 w-4" />
              Back to history
            </Link>
          </Button>
        }
      />
    );
  }

  const aiResult = toAiResult(encounter);

  return (
    <div>
      <div className="mb-4 print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/encounters">
            <ArrowLeft className="h-4 w-4" />
            Encounter History
          </Link>
        </Button>
      </div>

      <PageHeader
        className="print:hidden"
        title={encounter.patientName}
        description={
          <span suppressHydrationWarning>
            {`${encounter.age}y · ${encounter.gender} · ${format(new Date(encounter.createdAt), "MMM d, yyyy h:mm a")}`}
          </span>
        }
        actions={
          <>
            <StatusBadge status={encounter.status} />
            <Button variant="outline" onClick={handleFhir} disabled={exporting}>
              <Download className="h-4 w-4" />
              FHIR Export
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              PDF / Print
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 print:hidden lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Chief Complaint" value={encounter.chiefComplaint} />
            <Detail label="HPI" value={encounter.historyOfPresentIllness} />
            <Detail label="Past Medical History" value={encounter.pastMedicalHistory} />
            <Detail label="Medications" value={encounter.medications} />
            <Detail label="Allergies" value={encounter.allergies} />
            <Detail label="Vitals" value={encounter.vitals} />
            <Detail label="Exam Findings" value={encounter.examFindings} />
            <Detail label="Labs" value={encounter.labs} />
            <Detail label="Assessment Notes" value={encounter.assessmentNotes} className="sm:col-span-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quality Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScoreGauge label="AI confidence" value={encounter.aiConfidence ?? 0} />
            <ScoreGauge
              label="Documentation quality"
              value={encounter.documentationQuality ?? 0}
            />
            {encounter.coding ? (
              <>
                <ScoreGauge label="Coding confidence" value={encounter.coding.confidence} />
                <ScoreGauge label="Claim readiness" value={encounter.coding.claimReadiness} />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {aiResult ? (
        <div className="print:hidden">
          <AiOutputPanels result={aiResult} />
        </div>
      ) : (
        <p className="print:hidden text-sm text-muted-foreground">
          No AI documentation has been generated for this encounter yet.
        </p>
      )}

      <EncounterPrintReport encounter={encounter} />
    </div>
  );
}

function toAiResult(encounter: Encounter): AiGenerationResult | null {
  if (!encounter.documentation || !encounter.coding || !encounter.cds) return null;
  return {
    documentation: encounter.documentation,
    coding: encounter.coding,
    cds: encounter.cds,
    aiConfidence: encounter.aiConfidence ?? 0,
    documentationQuality: encounter.documentationQuality ?? 0,
  };
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 whitespace-pre-wrap text-foreground">{value || "—"}</div>
    </div>
  );
}
