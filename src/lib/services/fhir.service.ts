import type { Encounter, FhirBundle } from "@/lib/types";
import { getSettings } from "@/stores/local-store";
import { randomDelay, uid } from "@/lib/utils";

/** FastAPI-shaped: POST /api/v1/fhir/export — FHIR R4 Bundle */
export async function exportFhirBundle(encounter: Encounter): Promise<FhirBundle> {
  await randomDelay(500, 1000);
  const patientId = encounter.patientId || uid("Patient");
  const encounterId = encounter.id;
  const settings = getSettings();
  const practitionerName = settings.doctorName || "Dr. Sarah Chen";

  const conditions =
    encounter.coding?.icd10.map((c, i) => ({
      fullUrl: `urn:uuid:condition-${i}`,
      resource: {
        resourceType: "Condition",
        id: `condition-${i}`,
        meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Condition"] },
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: "confirmed",
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
        recordedDate: encounter.createdAt,
      },
    })) ?? [];

  const medicationRequests = encounter.medications
    ? [
        {
          fullUrl: `urn:uuid:medreq-0`,
          resource: {
            resourceType: "MedicationRequest",
            id: "medreq-0",
            meta: { profile: ["http://hl7.org/fhir/StructureDefinition/MedicationRequest"] },
            status: "active",
            intent: "order",
            medicationCodeableConcept: { text: encounter.medications },
            subject: { reference: `Patient/${patientId}` },
            encounter: { reference: `Encounter/${encounterId}` },
            authoredOn: encounter.updatedAt,
            requester: { display: practitionerName },
            note: encounter.documentation?.medicationReview?.map((m) => ({
              text: `${m.medication}: ${m.status} — ${m.notes}`,
            })),
          },
        },
      ]
    : [];

  // Preserve prior MedicationStatement shape as additional continuity context when meds exist
  const medStatements = encounter.medications
    ? [
        {
          fullUrl: `urn:uuid:medstmt-0`,
          resource: {
            resourceType: "MedicationStatement",
            id: "medstmt-0",
            status: "active",
            medicationCodeableConcept: { text: encounter.medications },
            subject: { reference: `Patient/${patientId}` },
            context: { reference: `Encounter/${encounterId}` },
          },
        },
      ]
    : [];

  const observations: FhirBundle["entry"] = [];
  if (encounter.vitals) {
    observations.push({
      fullUrl: `urn:uuid:obs-vitals`,
      resource: {
        resourceType: "Observation",
        id: "obs-vitals",
        meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Observation"] },
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
                display: "Vital Signs",
              },
            ],
          },
        ],
        code: { text: "Vital signs panel" },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        effectiveDateTime: encounter.createdAt,
        valueString: encounter.vitals,
      },
    });
  }
  if (encounter.labs) {
    observations.push({
      fullUrl: `urn:uuid:obs-labs`,
      resource: {
        resourceType: "Observation",
        id: "obs-labs",
        meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Observation"] },
        status: "final",
        category: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "laboratory",
                display: "Laboratory",
              },
            ],
          },
        ],
        code: { text: "Clinical laboratory results" },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        effectiveDateTime: encounter.createdAt,
        valueString: encounter.labs,
      },
    });
  }

  const diagnosticReports: FhirBundle["entry"] = [];
  if (encounter.labs || encounter.documentation?.clinicalSummary) {
    diagnosticReports.push({
      fullUrl: `urn:uuid:diagnostic-report-0`,
      resource: {
        resourceType: "DiagnosticReport",
        id: "diagnostic-report-0",
        meta: { profile: ["http://hl7.org/fhir/StructureDefinition/DiagnosticReport"] },
        status: "final",
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "11502-2",
              display: "Laboratory report",
            },
          ],
          text: "Clinical diagnostic summary",
        },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        effectiveDateTime: encounter.updatedAt,
        issued: encounter.updatedAt,
        result: observations
          .filter((o) => o.resource.resourceType === "Observation")
          .map((o) => ({ reference: `Observation/${o.resource.id}` })),
        conclusion:
          encounter.documentation?.clinicalSummary ||
          encounter.assessmentNotes ||
          encounter.labs ||
          "Clinical diagnostic findings summarized for continuity of care.",
      },
    });
  }

  const carePlans: FhirBundle["entry"] = [];
  if (encounter.documentation?.treatmentPlan || encounter.documentation?.followUpPlan) {
    carePlans.push({
      fullUrl: `urn:uuid:careplan-0`,
      resource: {
        resourceType: "CarePlan",
        id: "careplan-0",
        meta: { profile: ["http://hl7.org/fhir/StructureDefinition/CarePlan"] },
        status: "active",
        intent: "plan",
        title: "Encounter care plan",
        description: encounter.documentation.treatmentPlan,
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        created: encounter.updatedAt,
        author: { display: practitionerName },
        activity: [
          {
            detail: {
              status: "scheduled",
              description: encounter.documentation.followUpPlan,
            },
          },
          ...(encounter.documentation.patientInstructions
            ? [
                {
                  detail: {
                    status: "not-started" as const,
                    description: encounter.documentation.patientInstructions,
                  },
                },
              ]
            : []),
        ],
        note: encounter.documentation.providerNotes
          ? [{ text: encounter.documentation.providerNotes }]
          : undefined,
      },
    });
  }

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
          meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Patient"] },
          name: [{ use: "official", text: encounter.patientName }],
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
          meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Encounter"] },
          status: encounter.status === "draft" ? "in-progress" : "finished",
          class: {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            code: "AMB",
            display: "ambulatory",
          },
          type: [
            {
              text: encounter.chiefComplaint,
            },
          ],
          subject: { reference: `Patient/${patientId}` },
          participant: [
            {
              individual: { display: practitionerName },
            },
          ],
          reasonCode: [{ text: encounter.chiefComplaint }],
          period: {
            start: encounter.createdAt,
            end: encounter.updatedAt,
          },
        },
      },
      ...conditions,
      ...medicationRequests,
      ...medStatements,
      ...observations,
      ...diagnosticReports,
      ...carePlans,
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
