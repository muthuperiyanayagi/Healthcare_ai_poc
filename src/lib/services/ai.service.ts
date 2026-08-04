import type {
  AiGenerationResult,
  CareGapResult,
  ClaimReadinessResult,
  DenialRiskPrediction,
  EncounterInput,
  ExecutiveSummary,
  PriorAuthAssessment,
  RevenuePrediction,
} from "@/lib/types";
import {
  buildCareGaps,
  buildClaimReadiness,
  buildDenialRisk,
  buildExecutiveSummary,
  buildPriorAuth,
  buildRevenuePrediction,
  detectClinicalScenario,
  generateClinicalAi,
} from "@/lib/mock/generators";
import { delay } from "@/lib/utils";

/** FastAPI-shaped: POST /api/v1/encounters/generate */
export async function generateDocumentation(input: EncounterInput): Promise<AiGenerationResult> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, type: "all" }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate documentation");
  }
  return response.json();
}

/** FastAPI-shaped: POST /api/v1/ai/claim-readiness */
export async function assessClaimReadiness(input: EncounterInput): Promise<ClaimReadinessResult> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, type: "claim-readiness" }),
  });
  if (!response.ok) {
    throw new Error("Failed to assess claim readiness");
  }
  const result = await response.json();
  return result.claimReadinessDetail!;
}

/** FastAPI-shaped: POST /api/v1/ai/denial-risk */
export async function predictDenialRisk(input: EncounterInput): Promise<DenialRiskPrediction> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, type: "denial-risk" }),
  });
  if (!response.ok) {
    throw new Error("Failed to predict denial risk");
  }
  const result = await response.json();
  return result.denialRisk!;
}

/** FastAPI-shaped: POST /api/v1/ai/revenue-prediction */
export async function predictRevenue(input: EncounterInput): Promise<RevenuePrediction> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, type: "revenue-prediction" }),
  });
  if (!response.ok) {
    throw new Error("Failed to predict revenue");
  }
  const result = await response.json();
  return result.revenuePrediction!;
}

/** FastAPI-shaped: POST /api/v1/ai/care-gaps */
export async function detectCareGaps(input: EncounterInput): Promise<CareGapResult> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, type: "care-gaps" }),
  });
  if (!response.ok) {
    throw new Error("Failed to detect care gaps");
  }
  const result = await response.json();
  return result.careGaps!;
}

/** FastAPI-shaped: POST /api/v1/ai/prior-auth */
export async function assessPriorAuth(input: EncounterInput): Promise<PriorAuthAssessment> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, type: "prior-auth" }),
  });
  if (!response.ok) {
    throw new Error("Failed to assess prior authorization");
  }
  const result = await response.json();
  return result.priorAuth!;
}

/** FastAPI-shaped: POST /api/v1/ai/executive-summary */
export async function generateExecutiveSummary(input: EncounterInput): Promise<ExecutiveSummary> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, type: "executive-summary" }),
  });
  if (!response.ok) {
    throw new Error("Failed to generate executive summary");
  }
  const result = await response.json();
  return result.executiveSummary!;
}

/**
 * Shared helpers re-exported for Phase B modules that need partial builders
 * without regenerating the full clinical package.
 */
export {
  buildCareGaps,
  buildClaimReadiness,
  buildDenialRisk,
  buildExecutiveSummary,
  buildPriorAuth,
  buildRevenuePrediction,
  detectClinicalScenario,
};
