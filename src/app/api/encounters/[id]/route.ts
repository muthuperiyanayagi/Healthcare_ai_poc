import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, soapNotes } from "../../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "@/lib/auth/jwt";
import { createHash } from "crypto";

// Deterministic UUID mapper to convert client custom IDs to valid UUIDs
function toUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  const hash = createHash("md5").update(id).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `4${hash.substring(13, 16)}`, // set version to 4
    `8${hash.substring(17, 20)}`, // set variant to RFC4122
    hash.substring(20, 32),
  ].join("-");
}

async function getDoctorId(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;
  const payload = await verifyToken(token);
  const id = payload ? (payload as any).id || null : null;
  return id ? toUuid(id) : null;
}

// GET /api/encounters/[id] - Retrieve single encounter details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const doctorId = await getDoctorId(req);
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const sessionUuid = toUuid(rawId);

    const results = await db
      .select({
        session: sessions,
        soapNote: soapNotes,
      })
      .from(sessions)
      .leftJoin(soapNotes, eq(sessions.id, soapNotes.sessionId))
      .where(and(eq(sessions.id, sessionUuid), eq(sessions.doctorId, doctorId)))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    const { session, soapNote } = results[0];
    const alerts = (soapNote?.alerts as any) || {};
    const rawInput = alerts.rawInput || {};

    const encounter = {
      id: rawInput.clientEncounterId || session.id,
      patientId: rawInput.clientPatientId || session.patientId || "",
      patientName: session.patientName,
      age: session.patientAge || 0,
      gender: (session.patientGender || "unknown") as any,
      chiefComplaint: session.chiefComplaint || "",
      status: (session.status === "REVIEW" ? "draft" : session.status === "COMPLETED" ? "reviewed" : "exported") as any,
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || new Date().toISOString(),
      historyOfPresentIllness: rawInput.historyOfPresentIllness || soapNote?.subjective || "",
      pastMedicalHistory: rawInput.pastMedicalHistory || "",
      medications: rawInput.medications || "",
      allergies: rawInput.allergies || "",
      vitals: rawInput.vitals || soapNote?.objective || "",
      examFindings: rawInput.examFindings || "",
      labs: rawInput.labs || soapNote?.assessment || "",
      assessmentNotes: rawInput.assessmentNotes || "",
      documentation: alerts.documentation,
      coding: alerts.coding,
      cds: alerts.cds,
      aiConfidence: soapNote?.confidenceScore ?? undefined,
      documentationQuality: soapNote?.accuracyPct ?? undefined,
      timeSavedMinutes: rawInput.timeSavedMinutes ?? undefined,
      claimReadinessDetail: alerts.claimReadinessDetail,
      denialRisk: alerts.denialRisk,
      revenuePrediction: alerts.revenuePrediction,
      careGaps: alerts.careGaps,
      priorAuth: alerts.priorAuth,
      productivity: alerts.productivity,
      executiveSummary: alerts.executiveSummary,
    };

    return NextResponse.json(encounter);
  } catch (error) {
    console.error("GET Encounter Detail API Error:", error);
    return NextResponse.json({ error: "Failed to retrieve encounter details" }, { status: 500 });
  }
}

// PATCH /api/encounters/[id] - Update encounter status or fields
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const doctorId = await getDoctorId(req);
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await params;
    const sessionUuid = toUuid(rawId);
    const patch = await req.json();

    // Verify ownership of session
    const results = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionUuid), eq(sessions.doctorId, doctorId)))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 });
    }

    const session = results[0];

    // Update status in sessions if present
    if (patch.status) {
      const dbStatus = patch.status === "draft" ? "REVIEW" : "COMPLETED";
      await db
        .update(sessions)
        .set({ status: dbStatus, updatedAt: new Date().toISOString() })
        .where(eq(sessions.id, sessionUuid));
    }

    // Merge and update soap notes alerts JSONB (contains claimReadinessDetail, denialRisk, coding, cds)
    const soapNotesResults = await db
      .select()
      .from(soapNotes)
      .where(eq(soapNotes.sessionId, sessionUuid))
      .limit(1);

    if (soapNotesResults.length > 0) {
      const soapNote = soapNotesResults[0];
      const currentAlerts = (soapNote.alerts as any) || {};

      const updatedAlerts = {
        ...currentAlerts,
        ...(patch.claimReadinessDetail && { claimReadinessDetail: patch.claimReadinessDetail }),
        ...(patch.denialRisk && { denialRisk: patch.denialRisk }),
        ...(patch.coding && { coding: patch.coding }),
        ...(patch.cds && { cds: patch.cds }),
        ...(patch.documentation && { documentation: patch.documentation }),
        ...(patch.executiveSummary && { executiveSummary: patch.executiveSummary }),
      };

      await db
        .update(soapNotes)
        .set({
          alerts: updatedAlerts,
          updatedAt: new Date().toISOString(),
          ...(patch.status && { noteState: patch.status === "draft" ? "draft" : "completed" }),
          ...(patch.aiConfidence !== undefined && { confidenceScore: patch.aiConfidence }),
          ...(patch.documentationQuality !== undefined && { accuracyPct: patch.documentationQuality }),
        })
        .where(eq(soapNotes.sessionId, sessionUuid));
    }

    // Fetch the updated encounter and return it
    const finalResults = await db
      .select({
        session: sessions,
        soapNote: soapNotes,
      })
      .from(sessions)
      .leftJoin(soapNotes, eq(sessions.id, soapNotes.sessionId))
      .where(and(eq(sessions.id, sessionUuid), eq(sessions.doctorId, doctorId)))
      .limit(1);

    const { session: updatedSession, soapNote } = finalResults[0];
    const alerts = (soapNote?.alerts as any) || {};
    const rawInput = alerts.rawInput || {};

    const updatedEncounter = {
      id: rawInput.clientEncounterId || updatedSession.id,
      patientId: rawInput.clientPatientId || updatedSession.patientId || "",
      patientName: updatedSession.patientName,
      age: updatedSession.patientAge || 0,
      gender: (updatedSession.patientGender || "unknown") as any,
      chiefComplaint: updatedSession.chiefComplaint || "",
      status: (updatedSession.status === "REVIEW" ? "draft" : updatedSession.status === "COMPLETED" ? "reviewed" : "exported") as any,
      createdAt: updatedSession.createdAt || new Date().toISOString(),
      updatedAt: updatedSession.updatedAt || new Date().toISOString(),
      historyOfPresentIllness: rawInput.historyOfPresentIllness || soapNote?.subjective || "",
      pastMedicalHistory: rawInput.pastMedicalHistory || "",
      medications: rawInput.medications || "",
      allergies: rawInput.allergies || "",
      vitals: rawInput.vitals || soapNote?.objective || "",
      examFindings: rawInput.examFindings || "",
      labs: rawInput.labs || soapNote?.assessment || "",
      assessmentNotes: rawInput.assessmentNotes || "",
      documentation: alerts.documentation,
      coding: alerts.coding,
      cds: alerts.cds,
      aiConfidence: soapNote?.confidenceScore ?? undefined,
      documentationQuality: soapNote?.accuracyPct ?? undefined,
      timeSavedMinutes: rawInput.timeSavedMinutes ?? undefined,
      claimReadinessDetail: alerts.claimReadinessDetail,
      denialRisk: alerts.denialRisk,
      revenuePrediction: alerts.revenuePrediction,
      careGaps: alerts.careGaps,
      priorAuth: alerts.priorAuth,
      productivity: alerts.productivity,
      executiveSummary: alerts.executiveSummary,
    };

    return NextResponse.json(updatedEncounter);
  } catch (error) {
    console.error("PATCH Encounter API Error:", error);
    return NextResponse.json({ error: "Failed to update encounter" }, { status: 500 });
  }
}
