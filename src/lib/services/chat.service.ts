import type { ChatMessage, Encounter } from "@/lib/types";
import { getEncounters } from "@/stores/local-store";
import { randomDelay, uid } from "@/lib/utils";

function contextEncounter(preferredId?: string): Encounter | undefined {
  const all = getEncounters();
  if (preferredId) return all.find((e) => e.id === preferredId) ?? all[0];
  return all[0];
}

function matchResponse(message: string, enc?: Encounter): string {
  const q = message.toLowerCase();
  const name = enc?.patientName ?? "the patient";
  const complaint = enc?.chiefComplaint ?? "the presenting complaint";

  if (q.includes("summar") || q.includes("overview")) {
    return [
      `**Encounter summary — ${name}**`,
      ``,
      `Chief complaint: ${complaint}`,
      enc?.documentation?.clinicalSummary
        ? `Clinical summary: ${enc.documentation.clinicalSummary}`
        : `HPI highlights: ${enc?.historyOfPresentIllness ?? "Not documented yet."}`,
      ``,
      `Status: ${enc?.status ?? "n/a"} · AI confidence: ${enc?.aiConfidence ?? "—"}%`,
      ``,
      `_Human review required before signing._`,
    ].join("\n");
  }

  if (q.includes("icd") || q.includes("code") || q.includes("coding")) {
    const codes = enc?.coding?.icd10 ?? [];
    if (!codes.length) {
      return "No ICD-10 codes are attached yet. Generate AI documentation on the New Encounter page first.";
    }
    return [
      `**ICD-10 explanation for ${name}**`,
      ...codes.map(
        (c) => `• **${c.code}** — ${c.description} (confidence ${Math.round(c.confidence)}%)`
      ),
      ``,
      enc?.coding
        ? `Overall coding confidence ${enc.coding.confidence}% · Claim readiness ${enc.coding.claimReadiness}%.`
        : "",
      ``,
      `These codes are suggestions based on documented findings and require clinician validation.`,
    ].join("\n");
  }

  if (q.includes("diagnos")) {
    return [
      `**Diagnostic framing — ${name}**`,
      enc?.documentation?.assessment ??
        enc?.assessmentNotes ??
        `Working assessment related to: ${complaint}`,
      ``,
      `Differential considerations are informed by HPI, vitals, and labs. Confirm with clinical judgment and available diagnostics.`,
    ].join("\n");
  }

  if (q.includes("treatment") || q.includes("plan") || q.includes("therapy")) {
    return [
      `**Treatment plan — ${name}**`,
      enc?.documentation?.treatmentPlan ??
        "Generate AI documentation to populate a structured treatment plan.",
      ``,
      `**Follow-up**`,
      enc?.documentation?.followUpPlan ?? "Define interval follow-up and return precautions.",
    ].join("\n");
  }

  if (q.includes("investigat") || q.includes("lab") || q.includes("test")) {
    const alerts =
      enc?.cds?.alerts.filter((a) => a.category === "investigation" || a.category === "missing_labs") ??
      [];
    if (alerts.length) {
      return [
        `**Recommended investigations**`,
        ...alerts.map((a) => `• **${a.title}**: ${a.detail}`),
        ``,
        `Also review currently documented labs: ${enc?.labs || "none listed"}.`,
      ].join("\n");
    }
    return `Documented labs/studies: ${enc?.labs || "None yet"}. Consider guideline-directed testing based on ${complaint}.`;
  }

  if (q.includes("missing") || q.includes("document")) {
    const missing =
      enc?.cds?.alerts.filter((a) => a.category === "missing_documentation" || a.category === "missing_labs") ??
      [];
    if (missing.length) {
      return ["**Missing documentation / labs**", ...missing.map((a) => `• ${a.title}: ${a.detail}`)].join(
        "\n"
      );
    }
    return "No critical documentation gaps flagged. Still verify HPI completeness, meds, allergies, and medical decision-making narrative.";
  }

  if (q.includes("interact") || q.includes("drug") || q.includes("medication")) {
    const interactions = enc?.cds?.alerts.filter((a) => a.category === "interaction") ?? [];
    return [
      `**Medication review — ${name}**`,
      `Current meds: ${enc?.medications || "None listed"}`,
      `Allergies: ${enc?.allergies || "Not documented"}`,
      interactions.length
        ? interactions.map((a) => `⚠ ${a.title}: ${a.detail}`).join("\n")
        : "No high-priority drug–drug interactions flagged in mock CDS for this encounter.",
    ].join("\n");
  }

  if (q.includes("discharge") || q.includes("after visit") || q.includes("avm")) {
    return [
      `**Draft discharge / after-visit summary — ${name}**`,
      `You were seen for: ${complaint}.`,
      enc?.documentation?.treatmentPlan
        ? `Plan: ${enc.documentation.treatmentPlan}`
        : "Plan: Follow clinician instructions provided today.",
      enc?.documentation?.followUpPlan
        ? `Follow-up: ${enc.documentation.followUpPlan}`
        : "Follow-up: As directed by your care team.",
      `Return sooner for worsening symptoms, chest pain, shortness of breath, or other urgent concerns.`,
      ``,
      `_Patient education draft — clinician must personalize before release._`,
    ].join("\n");
  }

  if (q.includes("patient-friendly") || q.includes("plain language") || q.includes("explain to patient")) {
    return [
      `**Patient-friendly explanation**`,
      `Hi — today's visit focused on ${complaint.toLowerCase()}.`,
      enc?.documentation?.clinicalSummary
        ? `In simple terms: ${enc.documentation.clinicalSummary}`
        : "Your clinician reviewed your symptoms and will share next steps tailored to you.",
      `Please take medicines exactly as prescribed, and contact the clinic if symptoms worsen.`,
    ].join("\n");
  }

  return [
    `I can help with summaries, ICD explanations, treatment plans, investigations, missing docs, drug interactions, discharge drafts, and patient-friendly language.`,
    enc
      ? `Currently using context from **${name}** (${complaint}).`
      : "No encounter context loaded yet — open an encounter or generate a new one.",
    ``,
    `Try: "Summarize the latest encounter" or "Explain the top ICD-10 codes".`,
  ].join("\n");
}

/** FastAPI-shaped: POST /api/v1/chat/ask */
export async function askOperyx(
  message: string,
  encounterId?: string
): Promise<ChatMessage> {
  await randomDelay(900, 1800);
  const enc = contextEncounter(encounterId);
  return {
    id: uid("msg"),
    role: "assistant",
    content: matchResponse(message, enc),
    createdAt: new Date().toISOString(),
  };
}
