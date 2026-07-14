import type {
  Encounter,
  EncounterInput,
  ExecutiveSummary,
  RevenueKpiSummary,
  RevenuePrediction,
} from "@/lib/types";
import { generateExecutiveSummary, predictRevenue } from "@/lib/services/ai.service";
import { getEncounters } from "@/stores/local-store";
import { randomDelay } from "@/lib/utils";

/**
 * Phase B service surface — Revenue Cycle Command Center
 * FastAPI-shaped routes under /api/v1/revenue/*
 */

export type RevenueLeakageRow = {
  encounterId: string;
  patientName: string;
  leakageAmount: number;
  riskFactor: string;
  claimScore: number;
  mitigation: string;
  status: "ready" | "needs_review" | "high_risk";
};

export type ClaimIntelligenceRow = {
  encounterId: string;
  patientName: string;
  chiefComplaint: string;
  codingAccuracy: number;
  claimReadiness: number;
  expectedReimbursement: number;
  revenueProtected: number;
  revenueAtRisk: number;
  denialRisk: number;
  documentationQuality: number;
  status: "ready" | "needs_review" | "high_risk";
};

export type RevenueTrendPoint = {
  day: string;
  protected: number;
  leakage: number;
  reimbursement: number;
};

export type RevenueQualityPoint = {
  day: string;
  accuracy: number;
  readiness: number;
  documentationQuality: number;
};

export type RevenueCommandCenter = {
  kpis: RevenueKpiSummary;
  protectedMtd: number;
  leakageMtd: number;
  atRiskToday: number;
  claimsToday: number;
  claimsReady: number;
  claimsAtRisk: number;
  averageCodingAccuracy: number;
  averageClaimReadiness: number;
  estimatedReimbursement: number;
  documentationQuality: number;
  topOpportunities: Array<{
    encounterId: string;
    patientName: string;
    revenueProtected: number;
    revenueAtRisk: number;
    claimScore: number;
  }>;
  leakageItems: RevenueLeakageRow[];
  claimIntelligence: ClaimIntelligenceRow[];
  trends: RevenueTrendPoint[];
  qualityTrends: RevenueQualityPoint[];
};

function claimStatus(score: number): ClaimIntelligenceRow["status"] {
  if (score >= 88) return "ready";
  if (score >= 78) return "needs_review";
  return "high_risk";
}

function riskFactorFor(e: Encounter, claimScore: number): string {
  if (e.denialRisk?.topDenialReasons?.[0]?.reason) {
    return e.denialRisk.topDenialReasons[0].reason;
  }
  if (e.claimReadinessDetail?.missingElements?.length) {
    return e.claimReadinessDetail.missingElements[0];
  }
  if (claimScore < 78) return "High denial risk / incomplete claim package";
  if (claimScore < 88) return "Documentation or coding hygiene gap";
  return "Residual under-coding exposure";
}

function mitigationFor(e: Encounter): string {
  return (
    e.claimReadinessDetail?.recommendations?.[0] ??
    e.denialRisk?.mitigationActions?.[0] ??
    "Complete claim readiness checklist before submit"
  );
}

function encounterInputFrom(e: Encounter): EncounterInput {
  return {
    patientName: e.patientName,
    age: e.age,
    gender: e.gender,
    chiefComplaint: e.chiefComplaint,
    historyOfPresentIllness: e.historyOfPresentIllness,
    pastMedicalHistory: e.pastMedicalHistory,
    medications: e.medications,
    allergies: e.allergies,
    vitals: e.vitals,
    examFindings: e.examFindings,
    labs: e.labs,
    assessmentNotes: e.assessmentNotes,
  };
}

function buildTrends(protectedMtd: number, leakageMtd: number, reimbursement: number): RevenueTrendPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weights = [0.14, 0.16, 0.15, 0.18, 0.17, 0.1, 0.1];
  return days.map((day, i) => ({
    day,
    protected: Math.round(protectedMtd * weights[i] * (0.85 + (i % 3) * 0.08)),
    leakage: Math.round(leakageMtd * weights[i] * (0.9 + (i % 2) * 0.12)),
    reimbursement: Math.round(reimbursement * weights[i] * (0.88 + (i % 4) * 0.05)),
  }));
}

function buildQualityTrends(
  accuracy: number,
  readiness: number,
  documentationQuality: number
): RevenueQualityPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, i) => ({
    day,
    accuracy: Number(Math.min(99, accuracy - 3 + ((i * 1.1) % 5)).toFixed(1)),
    readiness: Number(Math.min(99, readiness - 4 + ((i * 0.9) % 6)).toFixed(1)),
    documentationQuality: Number(
      Math.min(99, documentationQuality - 2.5 + ((i * 1.2) % 4.5)).toFixed(1)
    ),
  }));
}

/** GET /api/v1/revenue/command-center */
export async function getRevenueCommandCenter(): Promise<RevenueCommandCenter> {
  await randomDelay(600, 1100);
  const encounters = getEncounters().filter((e) => e.coding || e.revenuePrediction);
  const today = new Date().toISOString().slice(0, 10);
  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

  const claimIntelligence: ClaimIntelligenceRow[] = encounters.slice(0, 12).map((e) => {
    const claimReadiness = e.coding?.claimReadiness ?? e.claimReadinessDetail?.score ?? 80;
    const codingAccuracy = e.coding?.estimatedAccuracy ?? e.coding?.confidence ?? e.aiConfidence ?? 88;
    const revenueProtected = e.revenuePrediction?.revenueProtected ?? 180 + codingAccuracy;
    const revenueAtRisk =
      e.revenuePrediction?.revenueAtRisk ?? Math.max(20, 120 - claimReadiness);
    return {
      encounterId: e.id,
      patientName: e.patientName,
      chiefComplaint: e.chiefComplaint,
      codingAccuracy: Math.round(codingAccuracy),
      claimReadiness: Math.round(claimReadiness),
      expectedReimbursement: e.revenuePrediction?.expectedReimbursement ?? Math.round(210 * (claimReadiness / 90)),
      revenueProtected: Math.round(revenueProtected),
      revenueAtRisk: Math.round(revenueAtRisk),
      denialRisk: e.denialRisk?.overallRisk ?? Math.max(8, 100 - claimReadiness),
      documentationQuality: Math.round(e.documentationQuality ?? 90),
      status: claimStatus(claimReadiness),
    };
  });

  const topOpportunities = claimIntelligence
    .slice()
    .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
    .slice(0, 8)
    .map((row) => ({
      encounterId: row.encounterId,
      patientName: row.patientName,
      revenueProtected: row.revenueProtected,
      revenueAtRisk: row.revenueAtRisk,
      claimScore: row.claimReadiness,
    }));

  const leakageItems: RevenueLeakageRow[] = claimIntelligence
    .filter((row) => row.revenueAtRisk > 0)
    .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
    .map((row) => {
      const encounter = encounters.find((e) => e.id === row.encounterId)!;
      return {
        encounterId: row.encounterId,
        patientName: row.patientName,
        leakageAmount: row.revenueAtRisk,
        riskFactor: riskFactorFor(encounter, row.claimReadiness),
        claimScore: row.claimReadiness,
        mitigation: mitigationFor(encounter),
        status: row.status,
      };
    });

  const protectedMtd =
    18000 +
    claimIntelligence.reduce((s, o) => s + o.revenueProtected, 0) +
    encounters.length * 120;
  const leakageMtd = 5200 + claimIntelligence.reduce((s, o) => s + o.revenueAtRisk, 0);
  const estimatedReimbursement =
    14200 + claimIntelligence.reduce((s, o) => s + o.expectedReimbursement, 0);

  const averageCodingAccuracy = Number(
    avg(claimIntelligence.map((r) => r.codingAccuracy)).toFixed(1) || 92.5
  );
  const averageClaimReadiness = Number(
    avg(claimIntelligence.map((r) => r.claimReadiness)).toFixed(1) || 88.4
  );
  const documentationQuality = Number(
    avg(claimIntelligence.map((r) => r.documentationQuality)).toFixed(1) || 91.2
  );

  const claimsReady = claimIntelligence.filter((r) => r.status === "ready").length;
  const claimsAtRisk = claimIntelligence.filter((r) => r.status !== "ready").length;
  const claimsToday = Math.max(
    claimIntelligence.filter((r) => {
      const enc = encounters.find((e) => e.id === r.encounterId);
      return enc?.createdAt.slice(0, 10) === today;
    }).length,
    claimIntelligence.length
  );

  return {
    kpis: {
      netCollectionsRate: 94.2,
      daysInAR: 28,
      denialRate: 4.8,
      firstPassYield: 91.5,
      revenueProtectedMtd: protectedMtd,
      revenueLeakageMtd: leakageMtd,
    },
    protectedMtd,
    leakageMtd,
    atRiskToday: claimIntelligence.reduce((s, o) => s + o.revenueAtRisk, 0),
    claimsToday,
    claimsReady,
    claimsAtRisk,
    averageCodingAccuracy: averageCodingAccuracy || 92.5,
    averageClaimReadiness: averageClaimReadiness || 88.4,
    estimatedReimbursement,
    documentationQuality: documentationQuality || 91.2,
    topOpportunities,
    leakageItems,
    claimIntelligence,
    trends: buildTrends(protectedMtd, leakageMtd, estimatedReimbursement),
    qualityTrends: buildQualityTrends(
      averageCodingAccuracy || 92.5,
      averageClaimReadiness || 88.4,
      documentationQuality || 91.2
    ),
  };
}

/** POST /api/v1/revenue/predict */
export async function runRevenuePrediction(input: EncounterInput): Promise<RevenuePrediction> {
  return predictRevenue(input);
}

/** GET /api/v1/revenue/executive-summary — portfolio AI narrative */
export async function getRevenueExecutiveSummary(): Promise<{
  summary: ExecutiveSummary;
  sourceEncounterId: string | null;
}> {
  await randomDelay(500, 900);
  const encounters = getEncounters().filter((e) => e.coding || e.documentation);
  const source =
    encounters.find((e) => e.id === "enc_john_smith_001") ??
    encounters.find((e) => e.executiveSummary) ??
    encounters[0];

  if (!source) {
    return {
      sourceEncounterId: null,
      summary: {
        headline: "Revenue command center ready",
        clinicalHighlights: ["No coded encounters in portfolio yet"],
        codingHighlights: ["Generate a clinical note to unlock coding and claim signals"],
        revenueHighlights: ["Protected / leakage KPIs will populate from encounter-level predictions"],
        actionItems: ["Open Clinical Documentation and run AI generation on a visit"],
        narrative:
          "Once encounters include coding and revenue predictions, this panel synthesizes executive RCM guidance across the panel.",
      },
    };
  }

  if (source.executiveSummary) {
    return { summary: source.executiveSummary, sourceEncounterId: source.id };
  }

  const summary = await generateExecutiveSummary(encounterInputFrom(source));
  return { summary, sourceEncounterId: source.id };
}

/** Run prediction for a stored encounter id (command-center action) */
export async function runEncounterRevenuePrediction(encounterId: string): Promise<RevenuePrediction> {
  const encounter = getEncounters().find((e) => e.id === encounterId);
  if (!encounter) throw new Error("Encounter not found");
  return runRevenuePrediction(encounterInputFrom(encounter));
}
