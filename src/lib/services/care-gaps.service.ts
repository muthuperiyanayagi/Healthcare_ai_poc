import type { CareGapResult, Encounter, EncounterInput } from "@/lib/types";
import { detectCareGaps } from "@/lib/services/ai.service";
import { getEncounterById, getEncounters } from "@/stores/local-store";
import { randomDelay } from "@/lib/utils";

/**
 * Phase B service surface — Care Gap Detection
 * FastAPI-shaped routes under /api/v1/care-gaps/*
 */

function toEncounterInput(e: Encounter): EncounterInput {
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

/** GET /api/v1/care-gaps/panel */
export async function listCareGapPanel(): Promise<{
  openGaps: number;
  priorityGaps: number;
  averageClosureRate: number;
  items: Array<{
    encounterId: string;
    patientName: string;
    age: number;
    gender: string;
    chiefComplaint: string;
    gapCount: number;
    priorityCount: number;
    closureRate: number;
    topGap: string;
    topSeverity: CareGapResult["gaps"][number]["severity"] | null;
  }>;
}> {
  await randomDelay(500, 1000);
  const encounters = getEncounters().slice(0, 12);
  const items = await Promise.all(
    encounters.map(async (e) => {
      const result = e.careGaps ?? (await detectCareGaps(toEncounterInput(e)));
      const top = result.gaps[0];
      return {
        encounterId: e.id,
        patientName: e.patientName,
        age: e.age,
        gender: e.gender,
        chiefComplaint: e.chiefComplaint,
        gapCount: result.gaps.length,
        priorityCount: result.priorityCount,
        closureRate: result.closureRate,
        topGap: top?.title ?? "No open gaps",
        topSeverity: top?.severity ?? null,
      };
    })
  );

  // Surface diabetes / John Smith panel members first for clinical demo flow
  items.sort((a, b) => {
    const aBoost = a.patientName.toLowerCase().includes("john smith") ? 2 : a.priorityCount > 0 ? 1 : 0;
    const bBoost = b.patientName.toLowerCase().includes("john smith") ? 2 : b.priorityCount > 0 ? 1 : 0;
    if (bBoost !== aBoost) return bBoost - aBoost;
    return b.priorityCount - a.priorityCount;
  });

  const openGaps = items.reduce((s, i) => s + i.gapCount, 0);
  const priorityGaps = items.reduce((s, i) => s + i.priorityCount, 0);
  const averageClosureRate =
    items.length === 0
      ? 0
      : Math.round(items.reduce((s, i) => s + i.closureRate, 0) / items.length);

  return { openGaps, priorityGaps, averageClosureRate, items };
}

/** GET /api/v1/care-gaps/encounters/{id} */
export async function getEncounterCareGaps(encounterId: string): Promise<{
  encounter: Encounter;
  careGaps: CareGapResult;
}> {
  await randomDelay(400, 900);
  const encounter = getEncounterById(encounterId);
  if (!encounter) throw new Error("Encounter not found");

  const careGaps =
    encounter.careGaps ?? (await detectCareGaps(toEncounterInput(encounter)));

  return { encounter, careGaps };
}

/** POST /api/v1/care-gaps/detect */
export async function runCareGapDetection(input: EncounterInput): Promise<CareGapResult> {
  return detectCareGaps(input);
}

/** POST /api/v1/care-gaps/encounters/{id}/detect */
export async function runCareGapDetectionForEncounter(
  encounterId: string
): Promise<{ encounter: Encounter; careGaps: CareGapResult }> {
  const encounter = getEncounterById(encounterId);
  if (!encounter) throw new Error("Encounter not found");
  const careGaps = await runCareGapDetection(toEncounterInput(encounter));
  return { encounter, careGaps };
}
