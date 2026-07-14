"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FileWarning,
  Gauge,
  ListChecks,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreGauge } from "@/components/shared/score-gauge";
import { AiGeneratingSkeleton } from "@/components/shared/skeletons";
import type { PriorAuthAssessment, PriorAuthStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { PriorAuthFormValues } from "@/components/prior-auth/prior-auth-form";

const STATUS_LABEL: Record<PriorAuthStatus, string> = {
  not_required: "Not required",
  likely_required: "Likely required",
  submitted: "Submitted",
  approved: "Approved",
  denied: "Denied",
};

const STATUS_VARIANT: Record<
  PriorAuthStatus,
  "success" | "warning" | "secondary" | "destructive" | "accent"
> = {
  not_required: "success",
  likely_required: "warning",
  submitted: "accent",
  approved: "success",
  denied: "destructive",
};

export function presentPriorAuth(assessment: PriorAuthAssessment): Required<
  Pick<
    PriorAuthAssessment,
    | "coverageSummary"
    | "medicalNecessitySummary"
    | "requiredDocuments"
    | "missingDocuments"
    | "estimatedApprovalProbability"
    | "documentationChecklist"
  >
> &
  PriorAuthAssessment {
  return {
    ...assessment,
    coverageSummary:
      assessment.coverageSummary ??
      (assessment.required
        ? `${assessment.summary} Payer criteria and documentation gates will determine final coverage.`
        : `${assessment.summary} Services appear covered without prospective prior authorization.`),
    medicalNecessitySummary:
      assessment.medicalNecessitySummary ??
      "Clinical documentation supports medical necessity for the requested services based on presenting symptoms and indicated workup.",
    requiredDocuments: assessment.requiredDocuments ?? assessment.documentationChecklist,
    missingDocuments: assessment.missingDocuments ?? [],
    estimatedApprovalProbability:
      assessment.estimatedApprovalProbability ??
      (assessment.required ? 70 : 93),
    documentationChecklist: assessment.documentationChecklist,
  };
}

export function PriorAuthResults({
  assessment,
  loading,
  context,
}: {
  assessment: PriorAuthAssessment | null;
  loading?: boolean;
  context?: PriorAuthFormValues | null;
}) {
  if (loading) {
    return <AiGeneratingSkeleton />;
  }

  if (!assessment) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Assessment outputs</CardTitle>
          <CardDescription>
            Run an assessment to generate coverage summary, medical necessity, document gaps, approval
            probability, and the prior authorization checklist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/20 px-4 py-10 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground">
              Waiting for referral, insurance, and procedure intake
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const view = presentPriorAuth(assessment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Prior authorization assessment
              </CardTitle>
              <CardDescription className="mt-1">{view.summary}</CardDescription>
            </div>
            <Badge variant={STATUS_VARIANT[view.status]} className="capitalize">
              {STATUS_LABEL[view.status]}
            </Badge>
          </div>
          {context ? (
            <div className="mt-3 grid gap-2 rounded-xl border border-border/70 bg-secondary/25 px-3 py-2 text-xs sm:grid-cols-3">
              <Meta label="Payer" value={`${context.insurancePayer} · ${context.insurancePlan}`} />
              <Meta
                label="Procedure"
                value={`${context.procedureCode} — ${context.procedureDescription}`}
              />
              <Meta
                label="Referral"
                value={context.referralFileName ?? "None attached"}
              />
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ScoreGauge
              label="Estimated approval probability"
              value={view.estimatedApprovalProbability}
            />
            <div className="flex flex-col justify-center gap-1 rounded-xl border border-border/70 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gauge className="h-4 w-4 text-accent" />
                Turnaround
              </div>
              <p className="font-display text-xl font-semibold tabular-nums">
                {view.estimatedTurnaroundDays === 0
                  ? "No PA wait"
                  : `~${view.estimatedTurnaroundDays} business days`}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <NarrativePanel
          icon={ShieldCheck}
          title="Coverage summary"
          body={view.coverageSummary}
        />
        <NarrativePanel
          icon={Stethoscope}
          title="Medical necessity summary"
          body={view.medicalNecessitySummary}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DocumentList
          icon={CheckCircle2}
          title="Required documents"
          items={view.requiredDocuments}
          tone="neutral"
          empty="No additional documents flagged"
        />
        <DocumentList
          icon={FileWarning}
          title="Missing documents"
          items={view.missingDocuments}
          tone="warning"
          empty="No gaps — packet looks complete for this pathway"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" />
            Prior authorization checklist
          </CardTitle>
          <CardDescription>Documentation gates before PA submission</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {view.documentationChecklist.map((item, idx) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-xl border border-border/70 px-3 py-2.5"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                {idx + 1}
              </span>
              <p className="text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {(view.services.length > 0 || view.payerHints.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {view.services.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Service-level PA signals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {view.services.map((svc) => (
                  <div
                    key={`${svc.code}-${svc.description}`}
                    className="rounded-xl border border-border/70 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        <span className="font-mono text-xs text-muted-foreground">{svc.code}</span>{" "}
                        {svc.description}
                      </p>
                      <Badge variant={svc.likelyRequired ? "warning" : "success"}>
                        {svc.likelyRequired ? "PA likely" : "No PA"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{svc.payerCriteria}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {view.payerHints.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CircleAlert className="h-4 w-4 text-accent" />
                  Payer hints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {view.payerHints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}

function NarrativePanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{body}</p>
      </CardContent>
    </Card>
  );
}

function DocumentList({
  icon: Icon,
  title,
  items,
  tone,
  empty,
}: {
  icon: typeof CheckCircle2;
  title: string;
  items: string[];
  tone: "neutral" | "warning";
  empty: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon
            className={cn("h-4 w-4", tone === "warning" ? "text-warning" : "text-primary")}
          />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm leading-relaxed",
                  tone === "warning"
                    ? "border-warning/30 bg-warning/5 text-foreground"
                    : "border-border/70"
                )}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
