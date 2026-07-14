import type { EncounterInput, PriorAuthAssessment } from "@/lib/types";
import { assessPriorAuth } from "@/lib/services/ai.service";
import { getEncounters } from "@/stores/local-store";
import { randomDelay } from "@/lib/utils";

/**
 * Phase B service surface — Prior Authorization Assistant
 * FastAPI-shaped routes under /api/v1/prior-auth/*
 */

/** GET /api/v1/prior-auth/queue */
export async function listPriorAuthQueue(): Promise<{
  pendingReview: number;
  notRequired: number;
  likelyRequired: number;
  items: Array<{
    encounterId: string;
    patientName: string;
    status: PriorAuthAssessment["status"];
    required: boolean;
    summary: string;
    turnaroundDays: number;
  }>;
}> {
  await randomDelay(500, 1000);
  const encounters = getEncounters().slice(0, 10);
  const items = await Promise.all(
    encounters.map(async (e) => {
      const input: EncounterInput = {
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
      const assessment = e.priorAuth ?? (await assessPriorAuth(input));
      return {
        encounterId: e.id,
        patientName: e.patientName,
        status: assessment.status,
        required: assessment.required,
        summary: assessment.summary,
        turnaroundDays: assessment.estimatedTurnaroundDays,
      };
    })
  );

  return {
    pendingReview: items.filter((i) => i.status === "likely_required" || i.status === "submitted").length,
    notRequired: items.filter((i) => i.status === "not_required").length,
    likelyRequired: items.filter((i) => i.required || i.status === "likely_required").length,
    items,
  };
}

/** POST /api/v1/prior-auth/assess */
export async function runPriorAuthAssessment(input: EncounterInput): Promise<PriorAuthAssessment> {
  return assessPriorAuth(input);
}
