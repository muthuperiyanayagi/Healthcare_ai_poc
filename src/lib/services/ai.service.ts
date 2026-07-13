import type { AiGenerationResult, EncounterInput } from "@/lib/types";
import { generateClinicalAi } from "@/lib/mock/generators";
import { delay } from "@/lib/utils";

/** FastAPI-shaped: POST /api/v1/encounters/generate */
export async function generateDocumentation(input: EncounterInput): Promise<AiGenerationResult> {
  // Simulated clinical AI latency (~1.5–2.5s)
  await delay(1500 + Math.floor(Math.random() * 1000));
  return generateClinicalAi(input);
}
