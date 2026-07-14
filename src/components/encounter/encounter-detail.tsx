"use client";

import { format } from "date-fns";
import type { Encounter } from "@/lib/types";
import { getSettings } from "@/stores/local-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { CodingTable, CdsAlertList } from "@/components/encounter/ai-output-panels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EncounterPrintReport({ encounter }: { encounter: Encounter }) {
  const settings = getSettings();
  const hospital = settings.hospitalName || "Operyx Memorial Hospital";
  const doctor = settings.doctorName || "Dr. Sarah Chen";
  const organization = settings.organization || "Operyx Health Network";

  return (
    <div id="print-report" className="hidden print:block">
      <header className="print-header">
        <div>
          <h1>{hospital}</h1>
          <p className="print-subtitle">{organization} · Operyx AI Clinical Intelligence</p>
        </div>
        <div className="print-meta">
          <p>Clinical Documentation Report</p>
          <p suppressHydrationWarning>
            Generated {format(new Date(encounter.updatedAt || encounter.createdAt), "PPpp")}
          </p>
          <p>Human review required before filing</p>
        </div>
      </header>

      <section className="print-section">
        <h2>Patient</h2>
        <p>
          <strong>{encounter.patientName}</strong> · {encounter.age}y · {encounter.gender}
        </p>
        <p>
          <strong>Chief complaint:</strong> {encounter.chiefComplaint}
        </p>
        <p>
          <strong>Status:</strong> {encounter.status}
          {encounter.aiConfidence != null ? ` · AI confidence ${encounter.aiConfidence}%` : ""}
          {encounter.documentationQuality != null
            ? ` · Doc quality ${encounter.documentationQuality}%`
            : ""}
        </p>
      </section>

      {encounter.documentation ? (
        <>
          <section className="print-section">
            <h2>Clinical summary</h2>
            <p>{encounter.documentation.clinicalSummary}</p>
            {encounter.documentation.clinicalContextSummary ? (
              <p>{encounter.documentation.clinicalContextSummary}</p>
            ) : null}
          </section>

          <section className="print-section">
            <h2>SOAP</h2>
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
          </section>

          <section className="print-section">
            <h2>Assessment & plan</h2>
            <p>
              <strong>Assessment:</strong> {encounter.documentation.assessment}
            </p>
            <p>
              <strong>Treatment:</strong> {encounter.documentation.treatmentPlan}
            </p>
            <p>
              <strong>Follow-up:</strong> {encounter.documentation.followUpPlan}
            </p>
            {encounter.documentation.patientInstructions ? (
              <p>
                <strong>Patient instructions:</strong> {encounter.documentation.patientInstructions}
              </p>
            ) : null}
            {encounter.documentation.providerNotes ? (
              <p>
                <strong>Provider notes:</strong> {encounter.documentation.providerNotes}
              </p>
            ) : null}
          </section>

          {encounter.documentation.differentialDiagnosis?.length ? (
            <section className="print-section">
              <h2>Differential diagnosis</h2>
              <ul>
                {encounter.documentation.differentialDiagnosis.map((dx) => (
                  <li key={dx.condition}>
                    {dx.condition} ({dx.likelihood})
                    {dx.icd10Hint ? ` — ${dx.icd10Hint}` : ""}: {dx.rationale}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {encounter.documentation.medicalNecessitySummary ? (
            <section className="print-section">
              <h2>Medical necessity</h2>
              <p>{encounter.documentation.medicalNecessitySummary.summary}</p>
            </section>
          ) : null}
        </>
      ) : null}

      {encounter.coding ? (
        <section className="print-section">
          <h2>Coding summary</h2>
          <p>
            Confidence {encounter.coding.confidence}% · Completeness {encounter.coding.completeness}% ·
            Claim readiness {encounter.coding.claimReadiness}%
            {encounter.coding.estimatedAccuracy != null
              ? ` · Estimated accuracy ${encounter.coding.estimatedAccuracy}%`
              : ""}
          </p>
          <h3>ICD-10</h3>
          <ul>
            {encounter.coding.icd10.map((c) => (
              <li key={c.code}>
                {c.code} — {c.description}
                {c.explanation ? ` (${c.explanation})` : ""}
              </li>
            ))}
          </ul>
          <h3>CPT</h3>
          <ul>
            {encounter.coding.cpt.map((c) => (
              <li key={c.code}>
                {c.code} — {c.description}
                {c.explanation ? ` (${c.explanation})` : ""}
              </li>
            ))}
          </ul>
          {encounter.coding.hcpcs?.length ? (
            <>
              <h3>HCPCS</h3>
              <ul>
                {encounter.coding.hcpcs.map((c) => (
                  <li key={c.code}>
                    {c.code} — {c.description}
                    {c.explanation ? ` (${c.explanation})` : ""}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {encounter.documentation?.codingExplanation ? (
            <p>
              <strong>Coding explanation:</strong> {encounter.documentation.codingExplanation}
            </p>
          ) : null}
        </section>
      ) : null}

      {(encounter.executiveSummary || encounter.coding?.codingRecommendations?.length) && (
        <section className="print-section">
          <h2>Recommendations</h2>
          {encounter.executiveSummary ? <p>{encounter.executiveSummary.narrative}</p> : null}
          {encounter.executiveSummary?.actionItems?.length ? (
            <ul>
              {encounter.executiveSummary.actionItems.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          ) : null}
          {encounter.coding?.codingRecommendations?.map((r) => (
            <p key={r.id}>
              <strong>{r.title}:</strong> {r.detail}
            </p>
          ))}
        </section>
      )}

      <footer className="print-signature">
        <div className="signature-block">
          <p className="signature-line" />
          <p>
            <strong>{doctor}</strong>
          </p>
          <p>Attending / Authorizing Clinician</p>
          <p suppressHydrationWarning>Date: {format(new Date(), "PP")}</p>
        </div>
        <div className="signature-block">
          <p className="muted">
            Generated with Operyx AI Clinical Intelligence. AI suggestions require clinician
            verification. Not a substitute for professional medical judgment.
          </p>
        </div>
      </footer>
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
            {encounter.documentation.clinicalContextSummary ? (
              <Detail
                label="Clinical context"
                value={encounter.documentation.clinicalContextSummary}
              />
            ) : null}
            <Detail label="SOAP Subjective" value={encounter.documentation.soap.subjective} />
            <Detail label="SOAP Objective" value={encounter.documentation.soap.objective} />
            <Detail label="SOAP Assessment" value={encounter.documentation.soap.assessment} />
            <Detail label="SOAP Plan" value={encounter.documentation.soap.plan} />
            <Detail label="Treatment plan" value={encounter.documentation.treatmentPlan} />
            <Detail label="Follow-up" value={encounter.documentation.followUpPlan} />
            {encounter.documentation.patientInstructions ? (
              <Detail
                label="Patient instructions"
                value={encounter.documentation.patientInstructions}
              />
            ) : null}
            {encounter.documentation.providerNotes ? (
              <Detail label="Provider notes" value={encounter.documentation.providerNotes} />
            ) : null}
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
