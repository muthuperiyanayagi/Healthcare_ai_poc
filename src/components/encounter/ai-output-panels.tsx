"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock3, Gauge, Info, Siren, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { AiGeneratingSkeleton } from "@/components/shared/skeletons";
import type {
  AiGenerationResult,
  CdsAlert,
  CodeItem,
  CodingResult,
  DifferentialDiagnosisItem,
  MedicationReviewItem,
} from "@/lib/types";
import { cn, formatMinutes } from "@/lib/utils";

export function AiOutputPanels({
  result,
  loading,
}: {
  result: AiGenerationResult | null;
  loading?: boolean;
}) {
  if (loading) {
    return <AiGeneratingSkeleton />;
  }

  if (!result) {
    return null;
  }

  const { documentation, coding, cds } = result;
  const completeness =
    documentation.documentationCompletenessScore ?? coding.completeness ?? result.documentationQuality;
  const timeSaved =
    result.documentationTimeSavedMinutes ?? result.productivity?.documentationMinutesSaved;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>AI clinical outputs</CardTitle>
          <CardDescription>
            SOAP, clinical intelligence, coding with explanations, and decision support — review before
            saving or exporting
          </CardDescription>
          <div className="grid gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-4">
            <ScoreGauge label="AI confidence" value={result.aiConfidence} />
            <ScoreGauge label="Documentation quality" value={result.documentationQuality} />
            <ScoreGauge label="Documentation completeness" value={completeness} />
            {result.productivity ? (
              <ScoreGauge
                label="Provider productivity"
                value={result.productivity.productivityIndex}
              />
            ) : (
              <ScoreGauge label="Claim readiness" value={coding.claimReadiness} />
            )}
          </div>
          {timeSaved ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2 text-sm">
              <Clock3 className="h-4 w-4 text-accent" />
              <span>
                Documentation time saved: <strong>{formatMinutes(timeSaved)}</strong>
              </span>
              {result.productivity ? (
                <span className="text-muted-foreground">
                  · {result.productivity.benchmarkComparison}
                </span>
              ) : null}
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="soap">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="soap">SOAP & Plans</TabsTrigger>
              <TabsTrigger value="clinical">Clinical Intelligence</TabsTrigger>
              <TabsTrigger value="coding">Medical Coding</TabsTrigger>
              <TabsTrigger value="cds">Clinical Decision Support</TabsTrigger>
            </TabsList>

            <TabsContent value="soap" className="space-y-4">
              <Section title="SOAP — Subjective" body={documentation.soap.subjective} />
              <Section title="SOAP — Objective" body={documentation.soap.objective} />
              <Section title="SOAP — Assessment" body={documentation.soap.assessment} />
              <Section title="SOAP — Plan" body={documentation.soap.plan} />
              <Section title="Clinical Summary" body={documentation.clinicalSummary} />
              <Section title="Assessment" body={documentation.assessment} />
              <Section title="Treatment Plan" body={documentation.treatmentPlan} />
              <Section title="Follow-up Plan" body={documentation.followUpPlan} />
            </TabsContent>

            <TabsContent value="clinical" className="space-y-4">
              {documentation.clinicalContextSummary ? (
                <Section title="Clinical Context Summary" body={documentation.clinicalContextSummary} />
              ) : null}
              {documentation.differentialDiagnosis?.length ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">Differential Diagnosis</h4>
                  {documentation.differentialDiagnosis.map((dx) => (
                    <DifferentialRow key={dx.condition} item={dx} />
                  ))}
                </div>
              ) : null}
              {documentation.clinicalReasoning ? (
                <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-primary">Clinical Reasoning</h4>
                  <p className="mb-3 text-sm leading-relaxed">{documentation.clinicalReasoning.summary}</p>
                  <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {documentation.clinicalReasoning.pathways.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <ScoreGauge
                    label="Reasoning confidence"
                    value={documentation.clinicalReasoning.confidence}
                  />
                </div>
              ) : null}
              {documentation.medicalNecessitySummary ? (
                <div className="space-y-2 rounded-xl border border-border/70 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-primary">Medical Necessity Summary</h4>
                    <Badge variant="secondary">{documentation.medicalNecessitySummary.score}%</Badge>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {documentation.medicalNecessitySummary.summary}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Justified services
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {documentation.medicalNecessitySummary.justifiedServices.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  {documentation.medicalNecessitySummary.gaps.length ? (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Gaps
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-warning">
                        {documentation.medicalNecessitySummary.gaps.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
              {documentation.medicationReview?.length ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-primary">Medication Review</h4>
                  {documentation.medicationReview.map((med) => (
                    <MedicationRow key={`${med.medication}-${med.status}`} item={med} />
                  ))}
                </div>
              ) : null}
              {documentation.patientInstructions ? (
                <Section title="Patient Instructions" body={documentation.patientInstructions} />
              ) : null}
              {documentation.providerNotes ? (
                <Section title="Provider Notes" body={documentation.providerNotes} />
              ) : null}
              {documentation.codingExplanation ? (
                <Section title="Coding Explanation" body={documentation.codingExplanation} />
              ) : null}
              {result.executiveSummary ? (
                <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-4">
                  <h4 className="text-sm font-semibold text-primary">Executive Summary</h4>
                  <p className="text-sm font-medium">{result.executiveSummary.headline}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {result.executiveSummary.narrative}
                  </p>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="coding">
              <CodingTable coding={coding} />
            </TabsContent>

            <TabsContent value="cds">
              <CdsAlertList
                alerts={cds.alerts}
                reasoning={cds.reasoning}
                confidence={cds.confidence}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
      <h4 className="mb-2 text-sm font-semibold text-primary">{title}</h4>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
}

function DifferentialRow({ item }: { item: DifferentialDiagnosisItem }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card-solid/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{item.condition}</p>
        <Badge variant="outline" className="capitalize">
          {item.likelihood}
        </Badge>
        {item.icd10Hint ? (
          <Badge variant="secondary" className="font-mono">
            {item.icd10Hint}
          </Badge>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{item.rationale}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Supporting: {item.supportingFindings.join(" · ")}
      </p>
    </div>
  );
}

function MedicationRow({ item }: { item: MedicationReviewItem }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card-solid/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{item.medication}</p>
        <Badge variant="secondary" className="capitalize">
          {item.status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
      {item.interactions?.length ? (
        <p className="mt-1 text-xs text-warning">Interactions: {item.interactions.join("; ")}</p>
      ) : null}
    </div>
  );
}

export function CodingTable({ coding }: { coding: CodingResult }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
        <ScoreGauge label="Coding confidence" value={coding.confidence} />
        <ScoreGauge label="Completeness" value={coding.completeness} />
        <ScoreGauge label="Claim readiness" value={coding.claimReadiness} />
        <ScoreGauge
          label="Estimated accuracy"
          value={coding.estimatedAccuracy ?? coding.confidence}
        />
        <ScoreGauge
          label="Dx / Proc confidence"
          value={Math.round(
            ((coding.diagnosisConfidence ?? coding.confidence) +
              (coding.procedureConfidence ?? coding.confidence)) /
              2
          )}
        />
      </div>

      {coding.medicalNecessityValidation ? (
        <div className="rounded-xl border border-border/70 bg-secondary/30 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h4 className="font-semibold">Medical necessity validation</h4>
            <Badge variant={coding.medicalNecessityValidation.isSupported ? "secondary" : "destructive"}>
              {coding.medicalNecessityValidation.score}%
            </Badge>
          </div>
          <p className="text-muted-foreground">{coding.medicalNecessityValidation.notes}</p>
        </div>
      ) : null}

      {coding.documentationValidation ? (
        <div className="rounded-xl border border-border/70 bg-secondary/30 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h4 className="font-semibold">Documentation validation</h4>
            <Badge variant="secondary">{coding.documentationValidation.score}%</Badge>
          </div>
          <p className="mb-2 text-muted-foreground">{coding.documentationValidation.notes}</p>
          {coding.documentationValidation.missingElements.length ? (
            <p className="text-xs text-warning">
              Missing: {coding.documentationValidation.missingElements.join("; ")}
            </p>
          ) : null}
        </div>
      ) : null}

      <CodeBlock title="ICD-10" items={coding.icd10} />
      <CodeBlock title="CPT" items={coding.cpt} />
      {coding.hcpcs && coding.hcpcs.length > 0 ? (
        <CodeBlock title="HCPCS" items={coding.hcpcs} />
      ) : null}

      {coding.codingRecommendations?.length ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Coding recommendations</h4>
          {coding.codingRecommendations.map((rec) => (
            <div key={rec.id} className="rounded-xl border border-border/70 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{rec.title}</p>
                <Badge variant="outline" className="capitalize">
                  {rec.priority}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{rec.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CodeBlock({ title, items }: { title: string; items: CodeItem[] }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${title}-${item.code}`}
            className="flex flex-col gap-1 rounded-xl border border-border/70 bg-card-solid/40 px-3 py-2"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-mono text-sm font-semibold text-accent">{item.code}</span>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Badge variant="secondary">{Math.round(item.confidence)}%</Badge>
            </div>
            {item.explanation ? (
              <p className="text-xs leading-relaxed text-foreground/80">{item.explanation}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CdsAlertList({
  alerts,
  reasoning,
  confidence,
}: {
  alerts: CdsAlert[];
  reasoning: string;
  confidence: number;
}) {
  return (
    <div className="space-y-4">
      <ScoreGauge label="AI confidence (CDS)" value={confidence} />
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No clinical decision support alerts.</p>
        ) : (
          alerts.map((alert) => <AlertRow key={alert.id} alert={alert} />)
        )}
      </div>
      <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
        <h4 className="mb-2 text-sm font-semibold">Reasoning</h4>
        <p className="text-sm leading-relaxed text-muted-foreground">{reasoning}</p>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: CdsAlert }) {
  const Icon =
    alert.severity === "critical" ? Siren : alert.severity === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-3",
        alert.severity === "critical" && "border-destructive/40 bg-destructive/10",
        alert.severity === "warning" && "border-warning/40 bg-warning/10",
        alert.severity === "info" && "border-info/30 bg-info/10"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          alert.severity === "critical" && "text-destructive",
          alert.severity === "warning" && "text-warning",
          alert.severity === "info" && "text-info"
        )}
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{alert.title}</p>
          <Badge variant="outline" className="capitalize">
            {alert.category.replaceAll("_", " ")}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>
      </div>
    </div>
  );
}
