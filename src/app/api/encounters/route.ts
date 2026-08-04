import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, soapNotes, patients } from "../../../../drizzle/schema";
import { eq, desc, and, or, ilike } from "drizzle-orm";
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

// Helper to get authenticated doctor ID from request cookies
async function getDoctorId(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? (payload as any).id || null : null;
}

// GET /api/encounters - List encounters (scoped to logged-in doctor)
export async function GET(req: Request) {
  try {
    const doctorId = await getDoctorId(req);
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 8);

    // 1. Build database query conditions
    let conditions = eq(sessions.doctorId, doctorId);

    if (status !== "all") {
      const mappedStatus = status === "draft" ? "REVIEW" : "COMPLETED";
      conditions = and(conditions, eq(sessions.status, mappedStatus)) as any;
    }

    if (search) {
      conditions = and(
        conditions,
        or(
          ilike(sessions.patientName, `%${search}%`),
          ilike(sessions.chiefComplaint, `%${search}%`)
        )
      ) as any;
    }

    // 2. Fetch total count
    const allSessions = await db
      .select()
      .from(sessions)
      .where(conditions);
    
    const total = allSessions.length;

    // 3. Fetch paginated sessions joined with soap notes
    const results = await db
      .select({
        session: sessions,
        soapNote: soapNotes,
      })
      .from(sessions)
      .leftJoin(soapNotes, eq(sessions.id, soapNotes.sessionId))
      .where(conditions)
      .orderBy(desc(sessions.createdAt))
      .offset((page - 1) * pageSize)
      .limit(pageSize);

    // 4. Map DB rows to Encounter models
    const items = results.map(({ session, soapNote }) => {
      const alerts = (soapNote?.alerts as any) || {};
      const rawInput = alerts.rawInput || {};

      // Keep original client-side custom ID prefix structure in the final client-facing JSON
      return {
        id: rawInput.clientEncounterId || session.id,
        patientId: rawInput.clientPatientId || session.patientId || "",
        patientName: session.patientName,
        age: session.patientAge || 0,
        gender: (session.patientGender || "unknown") as any,
        chiefComplaint: session.chiefComplaint || "",
        status: (session.status === "REVIEW" ? "draft" : "reviewed") as any,
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
    });

    return NextResponse.json({ items, total, page, pageSize });
  } catch (error) {
    console.error("GET Encounters API Error:", error);
    return NextResponse.json({ error: "Failed to load encounters" }, { status: 500 });
  }
}

// POST /api/encounters - Save/Create new encounter
export async function POST(req: Request) {
  try {
    const doctorId = await getDoctorId(req);
    if (!doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { encounter, ai } = body;

    // Convert custom string IDs to valid UUID formats
    const sessionUuid = toUuid(encounter.id);
    const clientPatientIdStr = encounter.patientId || "pat_temp";
    const patientUuid = toUuid(clientPatientIdStr);

    // Standardize patient email
    const patientEmail = `${encounter.patientName.toLowerCase().replace(/\s+/g, ".")}@patient-operyx.ai`;

    // Ensure the patient exists in the patients table (check by id or email)
    const existingPatients = await db
      .select()
      .from(patients)
      .where(or(eq(patients.id, patientUuid), eq(patients.email, patientEmail)))
      .limit(1);

    let finalPatientUuid = patientUuid;

    if (existingPatients.length === 0) {
      // Create new patient record matching patientUuid
      await db
        .insert(patients)
        .values({
          id: patientUuid,
          email: patientEmail,
          name: encounter.patientName,
          gender: encounter.gender === "unknown" ? null : encounter.gender,
          createdByDoctorId: doctorId,
        });
    } else {
      // Reuse existing patient's UUID
      finalPatientUuid = existingPatients[0].id;
    }

    // 1. Insert session
    const [sessionRow] = await db
      .insert(sessions)
      .values({
        id: sessionUuid,
        doctorId: doctorId,
        patientName: encounter.patientName,
        patientAge: encounter.age,
        patientGender: encounter.gender,
        chiefComplaint: encounter.chiefComplaint,
        status: encounter.status === "draft" ? "REVIEW" : "COMPLETED",
        patientId: finalPatientUuid,
      })
      .returning();

    // 2. Insert soap note containing structured details & inputs in alerts JSONB
    const [soapNoteRow] = await db
      .insert(soapNotes)
      .values({
        sessionId: sessionRow.id,
        subjective: encounter.historyOfPresentIllness,
        objective: `${encounter.vitals}\n\nExam Findings:\n${encounter.examFindings}`,
        assessment: `${encounter.labs}\n\nAssessment Notes:\n${encounter.assessmentNotes}`,
        plan: ai?.documentation?.plan || "",
        noteState: encounter.status === "draft" ? "draft" : "completed",
        confidenceScore: ai?.aiConfidence ?? 0,
        accuracyPct: ai?.documentationQuality ?? 0,
        alerts: {
          documentation: ai?.documentation,
          coding: ai?.coding,
          cds: ai?.cds,
          claimReadinessDetail: ai?.claimReadinessDetail,
          denialRisk: ai?.denialRisk,
          revenuePrediction: ai?.revenuePrediction,
          careGaps: ai?.careGaps,
          priorAuth: ai?.priorAuth,
          productivity: ai?.productivity,
          executiveSummary: ai?.executiveSummary,
          rawInput: {
            clientEncounterId: encounter.id,
            clientPatientId: clientPatientIdStr,
            historyOfPresentIllness: encounter.historyOfPresentIllness,
            pastMedicalHistory: encounter.pastMedicalHistory,
            medications: encounter.medications,
            allergies: encounter.allergies,
            vitals: encounter.vitals,
            examFindings: encounter.examFindings,
            labs: encounter.labs,
            assessmentNotes: encounter.assessmentNotes,
            timeSavedMinutes: encounter.timeSavedMinutes,
          },
        },
      })
      .returning();

    return NextResponse.json({ success: true, id: encounter.id });
  } catch (error) {
    console.error("POST Encounter API Error:", error);
    return NextResponse.json({ error: "Failed to save encounter" }, { status: 500 });
  }
}
