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

// Helper to handle API response and redirect to login if 401 Unauthorized
function handleUnauthorized(status: number) {
  if (status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("operyx.session");
    window.location.href = "/login";
  }
}

/** FastAPI-shaped: GET /api/v1/encounters */
export async function listEncounters(query: EncounterListQuery = {}): Promise<EncounterListResult> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 8;
  const search = (query.search ?? "").trim();
  const status = query.status ?? "all";

  try {
    const res = await fetch(
      `/api/encounters?search=${encodeURIComponent(search)}&status=${status}&page=${page}&pageSize=${pageSize}`
    );
    if (res.ok) {
      return await res.json();
    }
    handleUnauthorized(res.status);
    throw new Error(`API returned status ${res.status}`);
  } catch (err) {
    console.warn("API listEncounters failed, falling back to local store:", err);
  }

  // Fallback to local storage
  await randomDelay(300, 700);
  const searchLower = search.toLowerCase();
  let items = getEncounters();
  if (searchLower) {
    items = items.filter(
      (e) =>
        e.patientName.toLowerCase().includes(searchLower) ||
        e.chiefComplaint.toLowerCase().includes(searchLower)
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
  try {
    const res = await fetch(`/api/encounters/${id}`);
    if (res.ok) {
      return await res.json();
    }
    handleUnauthorized(res.status);
    throw new Error(`API returned status ${res.status}`);
  } catch (err) {
    console.warn("API getEncounter failed, falling back to local store:", err);
  }

  await randomDelay(200, 500);
  const enc = getEncounterById(id);
  if (!enc) throw new Error("Encounter not found");
  return enc;
}

/** FastAPI-shaped: POST /api/v1/encounters */
export async function createEncounter(
  input: EncounterInput,
  ai?: ReturnType<typeof generateClinicalAi>
): Promise<Encounter> {
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

  try {
    const res = await fetch("/api/encounters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encounter, ai: generated }),
    });
    if (res.ok) {
      // Also sync to local storage as double-backup
      saveEncounter(encounter);
      return encounter;
    }
    handleUnauthorized(res.status);
    throw new Error(`API returned status ${res.status}`);
  } catch (err) {
    console.warn("API createEncounter failed, saving to local store only:", err);
  }

  await randomDelay(400, 800);
  return saveEncounter(encounter);
}

/** FastAPI-shaped: PATCH /api/v1/encounters/{id} */
export async function patchEncounter(
  id: string,
  patch: Partial<Encounter>
): Promise<Encounter> {
  try {
    const res = await fetch(`/api/encounters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      // Sync local store
      saveEncounter(updated);
      return updated;
    }
    handleUnauthorized(res.status);
    throw new Error(`API returned status ${res.status}`);
  } catch (err) {
    console.warn("API patchEncounter failed, updating local store only:", err);
  }

  await randomDelay(200, 500);
  const updated = updateEncounter(id, patch);
  if (!updated) throw new Error("Encounter not found");
  return updated;
}

/** FastAPI-shaped: GET /api/v1/encounters/recent */
export async function getRecentEncounters(limit = 6): Promise<Encounter[]> {
  try {
    const res = await fetch(`/api/encounters?pageSize=${limit}`);
    if (res.ok) {
      const data = await res.json();
      return data.items;
    }
    handleUnauthorized(res.status);
    throw new Error(`API returned status ${res.status}`);
  } catch (err) {
    console.warn("API getRecentEncounters failed, falling back to local store:", err);
  }

  await randomDelay(200, 500);
  return getEncounters().slice(0, limit);
}
