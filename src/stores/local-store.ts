import type { AppSettings, AuthSession, Encounter } from "@/lib/types";
import { DEFAULT_SETTINGS, SEED_ENCOUNTERS } from "@/lib/mock/seed";

const KEYS = {
  encounters: "operyx.encounters",
  settings: "operyx.settings",
  session: "operyx.session",
  seeded: "operyx.seeded.v2",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeeded(): Encounter[] {
  if (!canUseStorage()) return [...SEED_ENCOUNTERS];
  const seeded = localStorage.getItem(KEYS.seeded);
  const existing = readJson<Encounter[] | null>(KEYS.encounters, null);
  if (!seeded || !existing || existing.length === 0) {
    writeJson(KEYS.encounters, SEED_ENCOUNTERS);
    localStorage.setItem(KEYS.seeded, "1");
    return [...SEED_ENCOUNTERS];
  }
  return existing;
}

export function getEncounters(): Encounter[] {
  return ensureSeeded().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getEncounterById(id: string): Encounter | undefined {
  return getEncounters().find((e) => e.id === id);
}

export function saveEncounter(encounter: Encounter): Encounter {
  const list = getEncounters();
  const idx = list.findIndex((e) => e.id === encounter.id);
  const next = [...list];
  if (idx >= 0) next[idx] = encounter;
  else next.unshift(encounter);
  writeJson(KEYS.encounters, next);
  return encounter;
}

export function updateEncounter(id: string, patch: Partial<Encounter>): Encounter | undefined {
  const current = getEncounterById(id);
  if (!current) return undefined;
  const updated: Encounter = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return saveEncounter(updated);
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(KEYS.settings, {}) };
}

export function saveSettings(settings: AppSettings): AppSettings {
  writeJson(KEYS.settings, settings);
  return settings;
}

export function getSession(): AuthSession | null {
  return readJson<AuthSession | null>(KEYS.session, null);
}

export function setSession(session: AuthSession | null): void {
  if (!canUseStorage()) return;
  if (!session) localStorage.removeItem(KEYS.session);
  else writeJson(KEYS.session, session);
}
