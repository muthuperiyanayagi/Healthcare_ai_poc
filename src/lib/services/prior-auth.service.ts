import type { EncounterInput, PriorAuthAssessment } from "@/lib/types";
import { assessPriorAuth } from "@/lib/services/ai.service";
import { listEncounters } from "./encounter.service";
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
  const { items: encounters } = await listEncounters({ pageSize: 10 });
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

      let assessment: PriorAuthAssessment;
      try {
        assessment = e.priorAuth ?? (await assessPriorAuth(input));
      } catch (err) {
        console.warn(`Fallback mock prior-auth details for display on encounter: ${e.id}`, err);
        assessment = {
          status: "likely_required",
          required: true,
          summary: "Prior authorization likely required based on standard commercial insurance policies for procedure.",
          estimatedTurnaroundDays: 7,
          services: [
            {
              code: e.coding?.cpt?.[0]?.code ?? "99214",
              description: e.coding?.cpt?.[0]?.description ?? "Office outpatient visit",
              likelyRequired: true,
              payerCriteria: "Clinical documentation must support complexity and medical necessity.",
            }
          ],
          documentationChecklist: ["Completed clinical chart note", "Prior conservative therapy trial records"],
          payerHints: ["Submit via insurer portal", "Include latest diagnostic lab reports"],
          coverageSummary: "Standard commercial plan coverage subject to medical necessity review.",
          medicalNecessitySummary: "Clinical documentation supports medical necessity criteria.",
          requiredDocuments: ["Chart notes", "Lab results"],
          missingDocuments: ["Lab results"],
          estimatedApprovalProbability: 0.85,
        };
      }

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
