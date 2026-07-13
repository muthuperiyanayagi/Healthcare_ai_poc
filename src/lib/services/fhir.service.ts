import type { Encounter, FhirBundle } from "@/lib/types";
import { randomDelay, uid } from "@/lib/utils";

/** FastAPI-shaped: POST /api/v1/fhir/export */
export async function exportFhirBundle(encounter: Encounter): Promise<FhirBundle> {
  await randomDelay(500, 1000);
  const patientId = encounter.patientId || uid("Patient");
  const encounterId = encounter.id;

  const conditions =
    encounter.coding?.icd10.map((c, i) => ({
      fullUrl: `urn:uuid:condition-${i}`,
      resource: {
        resourceType: "Condition",
        id: `condition-${i}`,
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
            },
          ],
        },
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10-cm",
              code: c.code,
              display: c.description,
            },
          ],
          text: c.description,
        },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
      },
    })) ?? [];

  const meds = encounter.medications
    ? [
        {
          fullUrl: `urn:uuid:med-0`,
          resource: {
            resourceType: "MedicationStatement",
            id: "med-0",
            status: "active",
            medicationCodeableConcept: { text: encounter.medications },
            subject: { reference: `Patient/${patientId}` },
            context: { reference: `Encounter/${encounterId}` },
          },
        },
      ]
    : [];

  const observations = encounter.labs
    ? [
        {
          fullUrl: `urn:uuid:obs-labs`,
          resource: {
            resourceType: "Observation",
            id: "obs-labs",
            status: "final",
            code: { text: "Clinical laboratory results" },
            subject: { reference: `Patient/${patientId}` },
            encounter: { reference: `Encounter/${encounterId}` },
            valueString: encounter.labs,
          },
        },
      ]
    : [];

  const bundle: FhirBundle = {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: [
      {
        fullUrl: `urn:uuid:${patientId}`,
        resource: {
          resourceType: "Patient",
          id: patientId,
          name: [{ text: encounter.patientName }],
          gender: encounter.gender,
          extension: [
            {
              url: "https://operyx.ai/fhir/age",
              valueInteger: encounter.age,
            },
          ],
        },
      },
      {
        fullUrl: `urn:uuid:${encounterId}`,
        resource: {
          resourceType: "Encounter",
          id: encounterId,
          status: encounter.status === "draft" ? "in-progress" : "finished",
          class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "AMB",
            display: "ambulatory",
          },
          subject: { reference: `Patient/${patientId}` },
          reasonCode: [{ text: encounter.chiefComplaint }],
          period: {
            start: encounter.createdAt,
            end: encounter.updatedAt,
          },
        },
      },
      ...conditions,
      ...meds,
      ...observations,
    ],
  };

  return bundle;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
