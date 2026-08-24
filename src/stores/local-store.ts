import type { AppSettings, AuthSession, Encounter } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/mock/seed";
import { encryptForStorage, decryptFromStorage } from "./local-crypto";

const KEYS = {
  encounters: "operyx.encounters",
  settings: "operyx.settings",
  session: "operyx.session",
  seeded: "operyx.seeded.v2",
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Values are AES-GCM encrypted before they touch localStorage — the
 * decryption key lives only in sessionStorage, so nothing readable persists
 * on disk once the browser session ends. */
async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value = await decryptFromStorage<T>(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  if (!canUseStorage()) return;
  localStorage.setItem(key, await encryptForStorage(value));
}

export async function ensureSeeded(): Promise<Encounter[]> {
  if (!canUseStorage()) return [];
  const existing = await readJson<Encounter[] | null>(KEYS.encounters, null);
  if (!existing || existing.length === 0) {
    await writeJson(KEYS.encounters, []);
    return [];
  }
  return existing;
}

export async function getEncounters(): Promise<Encounter[]> {
  const items = await ensureSeeded();
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getEncounterById(id: string): Promise<Encounter | undefined> {
  const items = await getEncounters();
  return items.find((e) => e.id === id);
}

export async function saveEncounter(encounter: Encounter): Promise<Encounter> {
  const list = await getEncounters();
  const idx = list.findIndex((e) => e.id === encounter.id);
  const next = [...list];
  if (idx >= 0) next[idx] = encounter;
  else next.unshift(encounter);
  await writeJson(KEYS.encounters, next);
  return encounter;
}

export async function updateEncounter(
  id: string,
  patch: Partial<Encounter>
): Promise<Encounter | undefined> {
  const current = await getEncounterById(id);
  if (!current) return undefined;
  const updated: Encounter = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return saveEncounter(updated);
}

export async function getSettings(): Promise<AppSettings> {
  return { ...DEFAULT_SETTINGS, ...(await readJson<Partial<AppSettings>>(KEYS.settings, {})) };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  await writeJson(KEYS.settings, settings);
  return settings;
}

export async function getSession(): Promise<AuthSession | null> {
  return readJson<AuthSession | null>(KEYS.session, null);
}

export async function setSession(session: AuthSession | null): Promise<void> {
  if (!canUseStorage()) return;
  if (!session) localStorage.removeItem(KEYS.session);
  else await writeJson(KEYS.session, session);
}
