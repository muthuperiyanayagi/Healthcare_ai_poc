"use client";

import { format } from "date-fns";
import type { Encounter } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { CodingTable, CdsAlertList } from "@/components/encounter/ai-output-panels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EncounterPrintReport({ encounter }: { encounter: Encounter }) {
  return (
    <div id="print-report" className="hidden print:block">
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Operyx AI Clinical Report</h1>
      <p style={{ marginBottom: 16, color: "#555" }} suppressHydrationWarning>
        Generated {format(new Date(encounter.updatedAt || encounter.createdAt), "PPpp")} · Human
        review required
      </p>
      <h2>
        {encounter.patientName} · {encounter.age}y · {encounter.gender}
      </h2>
      <p>
        <strong>Chief complaint:</strong> {encounter.chiefComplaint}
      </p>
      <p>
        <strong>Status:</strong> {encounter.status}
      </p>
      {encounter.documentation ? (
        <>
          <h3>SOAP</h3>
          <p>
            <strong>S:</strong> {encounter.documentation.soap.subjective}
          </p>
          <p>
            <strong>O:</strong> {encounter.documentation.soap.objective}
          </p>
          <p>
            <strong>A:</strong> {encounter.documentation.soap.assessment}
          </p>
          <p>
            <strong>P:</strong> {encounter.documentation.soap.plan}
          </p>
          <h3>Clinical summary</h3>
          <p>{encounter.documentation.clinicalSummary}</p>
          <h3>Treatment plan</h3>
          <p>{encounter.documentation.treatmentPlan}</p>
          <h3>Follow-up</h3>
          <p>{encounter.documentation.followUpPlan}</p>
        </>
      ) : null}
      {encounter.coding ? (
        <>
          <h3>ICD-10</h3>
          <ul>
            {encounter.coding.icd10.map((c) => (
              <li key={c.code}>
                {c.code} — {c.description}
              </li>
            ))}
          </ul>
          <h3>CPT</h3>
          <ul>
            {encounter.coding.cpt.map((c) => (
              <li key={c.code}>
                {c.code} — {c.description}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

export function EncounterDetailView({ encounter }: { encounter: Encounter }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">
              {encounter.patientName}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {encounter.age}y · {encounter.gender}
              </span>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{encounter.chiefComplaint}</p>
          </div>
          <StatusBadge status={encounter.status} />
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <Detail label="HPI" value={encounter.historyOfPresentIllness} />
          <Detail label="PMH" value={encounter.pastMedicalHistory} />
          <Detail label="Medications" value={encounter.medications} />
          <Detail label="Allergies" value={encounter.allergies} />
          <Detail label="Vitals" value={encounter.vitals} />
          <Detail label="Exam" value={encounter.examFindings} />
          <Detail label="Labs" value={encounter.labs} />
          <Detail label="Assessment notes" value={encounter.assessmentNotes} />
        </CardContent>
      </Card>

      {encounter.documentation ? (
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Detail label="Clinical summary" value={encounter.documentation.clinicalSummary} />
            <Detail label="SOAP Subjective" value={encounter.documentation.soap.subjective} />
            <Detail label="SOAP Objective" value={encounter.documentation.soap.objective} />
            <Detail label="SOAP Assessment" value={encounter.documentation.soap.assessment} />
            <Detail label="SOAP Plan" value={encounter.documentation.soap.plan} />
            <Detail label="Treatment plan" value={encounter.documentation.treatmentPlan} />
            <Detail label="Follow-up" value={encounter.documentation.followUpPlan} />
          </CardContent>
        </Card>
      ) : null}

      {encounter.coding ? (
        <Card>
          <CardHeader>
            <CardTitle>Coding</CardTitle>
          </CardHeader>
          <CardContent>
            <CodingTable coding={encounter.coding} />
          </CardContent>
        </Card>
      ) : null}

      {encounter.cds ? (
        <Card>
          <CardHeader>
            <CardTitle>Clinical decision support</CardTitle>
          </CardHeader>
          <CardContent>
            <CdsAlertList
              alerts={encounter.cds.alerts}
              reasoning={encounter.cds.reasoning}
              confidence={encounter.cds.confidence}
            />
          </CardContent>
        </Card>
      ) : null}

      <EncounterPrintReport encounter={encounter} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap leading-relaxed">{value || "—"}</p>
    </div>
  );
}
