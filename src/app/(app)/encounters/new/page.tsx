"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import {
  EncounterForm,
  EMPTY_ENCOUNTER_INPUT,
  toEncounterInput,
  type EncounterFormValues,
} from "@/components/encounter/encounter-form";
import { AiOutputPanels } from "@/components/encounter/ai-output-panels";
import { AiGeneratingSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { EncounterPrintReport } from "@/components/encounter/encounter-detail";
import { generateDocumentation } from "@/lib/services/ai.service";
import { createEncounter } from "@/lib/services/encounter.service";
import { downloadJson, exportFhirBundle } from "@/lib/services/fhir.service";
import type { AiGenerationResult, Encounter } from "@/lib/types";

export default function NewEncounterPage() {
  const router = useRouter();
  const [form, setForm] = useState<EncounterFormValues>(EMPTY_ENCOUNTER_INPUT);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AiGenerationResult | null>(null);
  const [saved, setSaved] = useState<Encounter | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    setSaved(null);
    try {
      const input = toEncounterInput(form);
      const ai = await generateDocumentation(input);
      setResult(ai);
      toast.success("AI clinical documentation ready");
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const enc = await createEncounter(toEncounterInput(form), result);
      setSaved(enc);
      toast.success("Encounter saved");
      router.push(`/encounters/${enc.id}`);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleFhir() {
    if (!result) return;
    try {
      const input = toEncounterInput(form);
      const draft: Encounter =
        saved ??
        ({
          id: "draft_export",
          patientId: "draft_patient",
          ...input,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documentation: result.documentation,
          coding: result.coding,
          cds: result.cds,
          aiConfidence: result.aiConfidence,
          documentationQuality: result.documentationQuality,
        } satisfies Encounter);
      const bundle = await exportFhirBundle(draft);
      downloadJson(
        `fhir-${input.patientName.replace(/\s+/g, "-").toLowerCase() || "encounter"}.json`,
        bundle
      );
      toast.success("FHIR Bundle downloaded");
    } catch {
      toast.error("FHIR export failed");
    }
  }

  function handlePdf() {
    if (!result) return;
    toast.message("Opening print dialog for PDF export");
    setTimeout(() => window.print(), 200);
  }

  const input = toEncounterInput(form);
  const printEncounter: Encounter | null = result
    ? saved ?? {
        id: "print_draft",
        patientId: "print_patient",
        ...input,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentation: result.documentation,
        coding: result.coding,
        cds: result.cds,
        aiConfidence: result.aiConfidence,
        documentationQuality: result.documentationQuality,
      }
    : null;

  return (
    <div>
      <PageHeader
        title="New encounter"
        description="Generate SOAP notes, coding suggestions, and clinical decision support"
      />

      <div className="space-y-6">
        <div className="no-print">
          <EncounterForm
            value={form}
            onChange={setForm}
            onGenerate={() => void handleGenerate()}
            generating={generating}
          />
        </div>

        {generating ? <AiGeneratingSkeleton /> : null}
        {result && !generating ? (
          <>
            <AiOutputPanels result={result} />
            <div className="no-print flex flex-wrap gap-2">
              <Button onClick={() => void handleSave()} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save encounter"}
              </Button>
              <Button variant="outline" onClick={() => void handleFhir()}>
                <Download className="h-4 w-4" />
                FHIR export
              </Button>
              <Button variant="outline" onClick={handlePdf}>
                <Printer className="h-4 w-4" />
                PDF export
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {printEncounter ? <EncounterPrintReport encounter={printEncounter} /> : null}
    </div>
  );
}
