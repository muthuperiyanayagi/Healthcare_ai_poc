import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import type { Encounter, EncounterStatus } from "@/lib/types";

function mapFhirStatus(status: string | undefined): EncounterStatus {
  if (status === "in-progress" || status === "planned" || status === "arrived") return "draft";
  return "reviewed";
}

function mapFhirEncounter(resource: any, patient: { id: string; name: string; age: number; gender: string }): Encounter {
  const start = resource.period?.start || resource.period?.end || new Date().toISOString();
  return {
    id: `epic-${resource.id}`,
    patientId: patient.id,
    patientName: patient.name,
    age: patient.age,
    gender: patient.gender as Encounter["gender"],
    chiefComplaint:
      resource.reasonCode?.[0]?.text ||
      resource.type?.[0]?.text ||
      resource.class?.display ||
      "Encounter",
    historyOfPresentIllness: "",
    pastMedicalHistory: "",
    medications: "",
    allergies: "",
    vitals: "",
    examFindings: "",
    labs: "",
    assessmentNotes: "",
    status: mapFhirStatus(resource.status),
    createdAt: start,
    updatedAt: resource.period?.end || start,
  };
}

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ items: [], reason: "no_session_cookie" });
  }

  const session = await verifyToken(token);
  const epic = session?.epic;

  // Not an Epic-derived session (e.g. demo email/password login) — nothing to fetch.
  if (!epic?.accessToken || !epic.patientId) {
    return NextResponse.json({ items: [], reason: "not_epic_session" });
  }

  if (Date.now() > epic.expiresAt) {
    return NextResponse.json({ items: [], reason: "epic_token_expired" });
  }

  try {
    const url = `${epic.fhirBaseUrl.replace(/\/$/, "")}/Encounter?patient=${encodeURIComponent(
      epic.patientId
    )}&_sort=-date&_count=20`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${epic.accessToken}`, Accept: "application/fhir+json" },
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn("Epic Encounter search failed:", res.status, text);
      return NextResponse.json({
        items: [],
        reason: "epic_request_failed",
        status: res.status,
        details: text.slice(0, 500),
      });
    }

    const bundle = await res.json();
    const patient = {
      id: epic.patientId,
      name: epic.patientName || "Unknown Patient",
      age: epic.patientAge ?? 0,
      gender: epic.patientGender || "unknown",
    };

    const items: Encounter[] = (bundle.entry || [])
      .map((entry: any) => entry.resource)
      .filter(Boolean)
      .map((resource: any) => mapFhirEncounter(resource, patient));

    return NextResponse.json({
      items,
      reason: items.length === 0 ? "epic_returned_no_encounters" : "ok",
      bundleTotal: bundle.total,
    });
  } catch (error) {
    console.error("Epic Encounter fetch error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch encounters from Epic" });
  }
}
