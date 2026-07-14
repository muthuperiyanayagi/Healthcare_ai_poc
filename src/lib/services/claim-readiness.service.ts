import type { ClaimReadinessResult, DenialRiskPrediction, Encounter, EncounterInput } from "@/lib/types";
import { assessClaimReadiness, predictDenialRisk } from "@/lib/services/ai.service";
import { getEncounterById, getEncounters } from "@/stores/local-store";
import { randomDelay } from "@/lib/utils";

/**
 * Phase B service surface — Claim Readiness & Denial Prevention
 * FastAPI-shaped routes under /api/v1/claim-readiness/*
 */

/** GET /api/v1/claim-readiness/portfolio */
export async function listClaimReadinessPortfolio(): Promise<{
  averageScore: number;
  readyCount: number;
  reviewCount: number;
  highRiskCount: number;
  items: Array<{
    encounterId: string;
    patientName: string;
    score: number;
    status: ClaimReadinessResult["status"];
    denialRisk: number;
  }>;
}> {
  await randomDelay(500, 1000);
  const encounters = getEncounters().filter((e) => e.coding);
  const items = encounters.slice(0, 12).map((e) => {
    const score = e.claimReadinessDetail?.score ?? e.coding?.claimReadiness ?? 80;
    const status =
      e.claimReadinessDetail?.status ??
      (score >= 88 ? "ready" : score >= 78 ? "needs_review" : "high_risk");
    return {
      encounterId: e.id,
      patientName: e.patientName,
      score,
      status: status as ClaimReadinessResult["status"],
      denialRisk: e.denialRisk?.overallRisk ?? Math.max(8, 100 - score),
    };
  });
  const averageScore =
    items.length === 0 ? 0 : Math.round(items.reduce((s, i) => s + i.score, 0) / items.length);
  return {
    averageScore,
    readyCount: items.filter((i) => i.status === "ready").length,
    reviewCount: items.filter((i) => i.status === "needs_review").length,
    highRiskCount: items.filter((i) => i.status === "high_risk").length,
    items,
  };
}

/** GET /api/v1/claim-readiness/encounters/{id} */
export async function getEncounterClaimReadiness(encounterId: string): Promise<{
  encounter: Encounter;
  claimReadiness: ClaimReadinessResult;
  denialRisk: DenialRiskPrediction;
}> {
  await randomDelay(400, 900);
  const encounter = getEncounterById(encounterId);
  if (!encounter) throw new Error("Encounter not found");

  const input: EncounterInput = {
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

  const [claimReadiness, denialRisk] = await Promise.all([
    encounter.claimReadinessDetail
      ? Promise.resolve(encounter.claimReadinessDetail)
      : assessClaimReadiness(input),
    encounter.denialRisk ? Promise.resolve(encounter.denialRisk) : predictDenialRisk(input),
  ]);

  return { encounter, claimReadiness, denialRisk };
}

/** POST /api/v1/claim-readiness/assess */
export async function runClaimReadinessAssessment(input: EncounterInput): Promise<{
  claimReadiness: ClaimReadinessResult;
  denialRisk: DenialRiskPrediction;
}> {
  const [claimReadiness, denialRisk] = await Promise.all([
    assessClaimReadiness(input),
    predictDenialRisk(input),
  ]);
  return { claimReadiness, denialRisk };
}
