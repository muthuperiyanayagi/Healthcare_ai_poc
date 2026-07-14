import type {
  ClaimReadinessResult,
  CodingResult,
  DenialRiskFactor,
  DenialRiskPrediction,
  Encounter,
} from "@/lib/types";

export const DENIAL_REASON_TAXONOMY = [
  "Missing Diagnosis",
  "Missing Modifier",
  "Incomplete Documentation",
  "Unsupported CPT",
  "Medical Necessity Missing",
  "Duplicate Diagnosis",
] as const;

export type DenialReasonTaxonomy = (typeof DENIAL_REASON_TAXONOMY)[number];

const TAXONOMY_MATCHERS: Record<DenialReasonTaxonomy, RegExp> = {
  "Missing Diagnosis": /missing\s+diagnos|diagnos(?:is|es)\s+(?:missing|unspecified|specificity)/i,
  "Missing Modifier": /modifier/i,
  "Incomplete Documentation": /incomplete|documentation|missing\s+doc|pending\s+lab|annotation/i,
  "Unsupported CPT": /unsupported\s+cpt|cpt|procedure|hcpcs|dsm?t/i,
  "Medical Necessity Missing": /medical\s+necessity|necessity/i,
  "Duplicate Diagnosis": /duplicate\s+diagnos/i,
};

export interface ClaimScoreBreakdown {
  claimReadiness: number;
  medicalNecessity: number;
  diagnosisSupport: number;
  procedureSupport: number;
  documentationCompleteness: number;
}

export function deriveScoreBreakdown(
  claim: ClaimReadinessResult,
  coding?: CodingResult | null,
  documentationCompleteness?: number | null
): ClaimScoreBreakdown {
  const medicalNecessity =
    coding?.medicalNecessityValidation?.score ??
    Math.max(55, claim.score - 4);
  const diagnosisSupport =
    coding?.diagnosisConfidence ??
    Math.round(
      coding?.icd10?.length
        ? coding.icd10.reduce((s, c) => s + c.confidence, 0) / coding.icd10.length
        : Math.max(60, claim.score - 2)
    );
  const procedureSupport =
    coding?.procedureConfidence ??
    Math.round(
      coding?.cpt?.length
        ? coding.cpt.reduce((s, c) => s + c.confidence, 0) / coding.cpt.length
        : Math.max(58, claim.score - 6)
    );
  const documentationCompletenessScore =
    documentationCompleteness ??
    coding?.documentationValidation?.score ??
    coding?.completeness ??
    Math.max(62, claim.score - 3);

  return {
    claimReadiness: claim.score,
    medicalNecessity,
    diagnosisSupport,
    procedureSupport,
    documentationCompleteness: documentationCompletenessScore,
  };
}

export function deriveCodingErrors(
  claim: ClaimReadinessResult,
  coding?: CodingResult | null
): string[] {
  const fromChecklist = claim.checklist
    .filter((item) => item.status === "fail" || item.status === "warn")
    .map((item) => `${item.label}: ${item.detail}`);
  const fromUnsupported =
    coding?.medicalNecessityValidation?.unsupportedServices.map(
      (s) => `Unsupported service: ${s}`
    ) ?? [];
  const fromRecs =
    coding?.codingRecommendations
      ?.filter((r) => r.priority === "high")
      .map((r) => r.title) ?? [];
  const merged = [...fromChecklist, ...fromUnsupported, ...fromRecs];
  return Array.from(new Set(merged)).slice(0, 8);
}

export function estimatedApprovalProbability(
  claim: ClaimReadinessResult,
  denial?: DenialRiskPrediction | null
): number {
  const risk = denial?.overallRisk ?? claim.estimatedDenialRisk;
  return Math.max(45, Math.min(99, 100 - risk));
}

export function flagTaxonomyReasons(
  factors: DenialRiskFactor[],
  missingElements: string[]
): Array<{ reason: DenialReasonTaxonomy; active: boolean; detail?: string }> {
  const haystack = [...factors.map((f) => f.reason), ...missingElements].join(" | ");
  return DENIAL_REASON_TAXONOMY.map((reason) => {
    const matcher = TAXONOMY_MATCHERS[reason];
    const match = factors.find((f) => matcher.test(f.reason));
    const active = Boolean(match) || matcher.test(haystack);
    return {
      reason,
      active,
      detail: match?.mitigation ?? (active ? undefined : undefined),
    };
  });
}

export function encounterToInput(encounter: Encounter) {
  return {
    patientName: encounter.patientName,
    age: encounter.age,
    gender: encounter.gender,
    chiefComplaint: encounter.chiefComplaint,
    historyOfPresentIllness: encounter.historyOfPresentIllness,
    pastMedicalHistory: encounter.pastMedicalHistory,
    medications: encounter.medications,
    allergies: encounter.allergies,
    vitals: encounter.vitals,
    examFindings: encounter.examFindings,
    labs: encounter.labs,
    assessmentNotes: encounter.assessmentNotes,
  };
}

export function statusVariant(
  status: ClaimReadinessResult["status"]
): "success" | "warning" | "destructive" {
  if (status === "ready") return "success";
  if (status === "needs_review") return "warning";
  return "destructive";
}

export function riskVariant(
  level: DenialRiskPrediction["riskLevel"]
): "success" | "warning" | "destructive" {
  if (level === "low") return "success";
  if (level === "moderate") return "warning";
  return "destructive";
}

export function riskLabel(level: DenialRiskPrediction["riskLevel"]): string {
  if (level === "moderate") return "Medium";
  return level.charAt(0).toUpperCase() + level.slice(1);
}
