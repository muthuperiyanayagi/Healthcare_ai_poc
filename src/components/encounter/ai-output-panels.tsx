"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info, Siren } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { AiGeneratingSkeleton } from "@/components/shared/skeletons";
import type { AiGenerationResult, CdsAlert, CodingResult } from "@/lib/types";
import { cn } from "@/lib/utils";

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
            SOAP, coding, and decision support — review before saving or exporting
          </CardDescription>
          <div className="grid gap-3 pt-2 md:grid-cols-2">
            <ScoreGauge label="AI confidence" value={result.aiConfidence} />
            <ScoreGauge label="Documentation quality" value={result.documentationQuality} />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="soap">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="soap">SOAP & Plans</TabsTrigger>
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

export function CodingTable({ coding }: { coding: CodingResult }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <ScoreGauge label="Coding confidence" value={coding.confidence} />
        <ScoreGauge label="Completeness" value={coding.completeness} />
        <ScoreGauge label="Claim readiness" value={coding.claimReadiness} />
      </div>
      <CodeBlock title="ICD-10" items={coding.icd10} />
      <CodeBlock title="CPT" items={coding.cpt} />
    </div>
  );
}

function CodeBlock({
  title,
  items,
}: {
  title: string;
  items: { code: string; description: string; confidence: number }[];
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${title}-${item.code}`}
            className="flex flex-col gap-1 rounded-xl border border-border/70 bg-card-solid/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <span className="font-mono text-sm font-semibold text-accent">{item.code}</span>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Badge variant="secondary">{Math.round(item.confidence)}%</Badge>
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
