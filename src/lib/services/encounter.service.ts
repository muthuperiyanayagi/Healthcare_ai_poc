import type { Encounter, EncounterInput, EncounterStatus } from "@/lib/types";
import { generateClinicalAi } from "@/lib/mock/generators";
import {
  getEncounterById,
  getEncounters,
  saveEncounter,
  updateEncounter,
} from "@/stores/local-store";
import { randomDelay, uid } from "@/lib/utils";

export interface EncounterListQuery {
  search?: string;
  status?: EncounterStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface EncounterListResult {
  items: Encounter[];
  total: number;
  page: number;
  pageSize: number;
}

/** FastAPI-shaped: GET /api/v1/encounters */
export async function listEncounters(query: EncounterListQuery = {}): Promise<EncounterListResult> {
  await randomDelay(500, 1100);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 8;
  const search = (query.search ?? "").trim().toLowerCase();
  const status = query.status ?? "all";

  let items = getEncounters();
  if (search) {
    items = items.filter(
      (e) =>
        e.patientName.toLowerCase().includes(search) ||
        e.chiefComplaint.toLowerCase().includes(search)
    );
  }
  if (status !== "all") {
    items = items.filter((e) => e.status === status);
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}

/** FastAPI-shaped: GET /api/v1/encounters/{id} */
export async function getEncounter(id: string): Promise<Encounter> {
  await randomDelay(400, 900);
  const enc = getEncounterById(id);
  if (!enc) throw new Error("Encounter not found");
  return enc;
}

/** FastAPI-shaped: POST /api/v1/encounters */
export async function createEncounter(
  input: EncounterInput,
  ai?: ReturnType<typeof generateClinicalAi>
): Promise<Encounter> {
  await randomDelay(600, 1200);
  const now = new Date().toISOString();
  const generated = ai ?? generateClinicalAi(input);
  const encounter: Encounter = {
    id: uid("enc"),
    patientId: uid("pat"),
    ...input,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    documentation: generated.documentation,
    coding: generated.coding,
    cds: generated.cds,
    aiConfidence: generated.aiConfidence,
    documentationQuality: generated.documentationQuality,
    timeSavedMinutes:
      generated.documentationTimeSavedMinutes ?? 10 + Math.round(Math.random() * 16),
    claimReadinessDetail: generated.claimReadinessDetail,
    denialRisk: generated.denialRisk,
    revenuePrediction: generated.revenuePrediction,
    careGaps: generated.careGaps,
    priorAuth: generated.priorAuth,
    productivity: generated.productivity,
    executiveSummary: generated.executiveSummary,
  };
  return saveEncounter(encounter);
}

/** FastAPI-shaped: PATCH /api/v1/encounters/{id} */
export async function patchEncounter(
  id: string,
  patch: Partial<Encounter>
): Promise<Encounter> {
  await randomDelay(400, 800);
  const updated = updateEncounter(id, patch);
  if (!updated) throw new Error("Encounter not found");
  return updated;
}

/** FastAPI-shaped: GET /api/v1/encounters/recent */
export async function getRecentEncounters(limit = 6): Promise<Encounter[]> {
  await randomDelay(400, 900);
  return getEncounters().slice(0, limit);
}
