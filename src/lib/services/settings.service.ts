import type { AppSettings } from "@/lib/types";
import { getSettings, saveSettings } from "@/stores/local-store";
import { randomDelay } from "@/lib/utils";

/** FastAPI-shaped: GET /api/v1/settings */
export async function fetchSettings(): Promise<AppSettings> {
  await randomDelay(300, 700);
  return getSettings();
}

/** FastAPI-shaped: PUT /api/v1/settings */
export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  await randomDelay(400, 900);
  return saveSettings(settings);
}

export const AI_PROVIDERS = [
  "Operyx Clinical AI",
  "Operyx Edge (on-prem mock)",
  "Partner LLM (mock)",
] as const;

export const AI_MODELS = [
  "operyx-clinical-v2",
  "operyx-clinical-fast",
  "operyx-coding-specialist",
] as const;
