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
  // Simulated clinical AI latency (~1.5–2.5s)
  await delay(1500 + Math.floor(Math.random() * 1000));
  return generateClinicalAi(input);
}

/** FastAPI-shaped: POST /api/v1/ai/claim-readiness */
export async function assessClaimReadiness(input: EncounterInput): Promise<ClaimReadinessResult> {
  await delay(700 + Math.floor(Math.random() * 500));
  const result = generateClinicalAi(input);
  return result.claimReadinessDetail!;
}

/** FastAPI-shaped: POST /api/v1/ai/denial-risk */
export async function predictDenialRisk(input: EncounterInput): Promise<DenialRiskPrediction> {
  await delay(700 + Math.floor(Math.random() * 500));
  const result = generateClinicalAi(input);
  return result.denialRisk!;
}

/** FastAPI-shaped: POST /api/v1/ai/revenue-prediction */
export async function predictRevenue(input: EncounterInput): Promise<RevenuePrediction> {
  await delay(700 + Math.floor(Math.random() * 500));
  const result = generateClinicalAi(input);
  return result.revenuePrediction!;
}

/** FastAPI-shaped: POST /api/v1/ai/care-gaps */
export async function detectCareGaps(input: EncounterInput): Promise<CareGapResult> {
  await delay(700 + Math.floor(Math.random() * 500));
  const result = generateClinicalAi(input);
  return result.careGaps!;
}

/** FastAPI-shaped: POST /api/v1/ai/prior-auth */
export async function assessPriorAuth(input: EncounterInput): Promise<PriorAuthAssessment> {
  await delay(700 + Math.floor(Math.random() * 500));
  const result = generateClinicalAi(input);
  return result.priorAuth!;
}

/** FastAPI-shaped: POST /api/v1/ai/executive-summary */
export async function generateExecutiveSummary(input: EncounterInput): Promise<ExecutiveSummary> {
  await delay(800 + Math.floor(Math.random() * 500));
  const result = generateClinicalAi(input);
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
