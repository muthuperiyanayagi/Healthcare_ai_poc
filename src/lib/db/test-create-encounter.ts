import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import { createHash } from "crypto";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

function toUuid(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  const hash = createHash("md5").update(id).digest("hex");
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    `4${hash.substring(13, 16)}`,
    `8${hash.substring(17, 20)}`,
    hash.substring(20, 32),
  ].join("-");
}

async function runTest() {
  console.log("Simulating POST /api/encounters database logic...");
  try {
    const doctorId = "01caf8c4-6c9d-475e-a22e-7d5a830048a3"; // Seeded doctor ID

    const sampleEncounter = {
      id: "enc_test_12345",
      patientId: "pat_test_999",
      patientName: "Alice Miller",
      age: 45,
      gender: "female",
      chiefComplaint: "Frequent headaches and blurred vision",
      historyOfPresentIllness: "Patient reports daily headaches for the last 2 weeks...",
      vitals: "BP: 130/85, HR: 72, Temp: 98.6",
      examFindings: "Pupils equal round and reactive to light.",
      labs: "None ordered today.",
      assessmentNotes: "Mild tension headaches vs early ophthalmic refraction issues.",
      status: "draft",
    };

    const sessionUuid = toUuid(sampleEncounter.id);
    const patientUuid = toUuid(sampleEncounter.patientId);
    const patientEmail = `${sampleEncounter.patientName.toLowerCase().replace(/\s+/g, ".")}@patient-operyx.ai`;

    // 1. Ensure patient exists
    console.log("1. Checking patient existence...");
    const existingPatients = await db
      .select()
      .from(schema.patients)
      .where(eq(schema.patients.id, patientUuid))
      .limit(1);

    if (existingPatients.length === 0) {
      console.log("Inserting new patient into database...");
      await db.insert(schema.patients).values({
        id: patientUuid,
        email: patientEmail,
        name: sampleEncounter.patientName,
        gender: sampleEncounter.gender,
        createdByDoctorId: doctorId,
      });
    } else {
      console.log("Patient already exists.");
    }

    // 2. Insert Session
    console.log("2. Inserting session into database...");
    const [sessionRow] = await db
      .insert(schema.sessions)
      .values({
        id: sessionUuid,
        doctorId: doctorId,
        patientName: sampleEncounter.patientName,
        patientAge: sampleEncounter.age,
        patientGender: sampleEncounter.gender,
        chiefComplaint: sampleEncounter.chiefComplaint,
        status: "REVIEW",
        patientId: patientUuid,
      })
      .returning();
    console.log("Inserted session ID:", sessionRow.id);

    // 3. Insert SOAP Note
    console.log("3. Inserting SOAP note into database...");
    const [soapNoteRow] = await db
      .insert(schema.soapNotes)
      .values({
        sessionId: sessionRow.id,
        subjective: sampleEncounter.historyOfPresentIllness,
        objective: `${sampleEncounter.vitals}\n\nExam Findings:\n${sampleEncounter.examFindings}`,
        assessment: `${sampleEncounter.labs}\n\nAssessment Notes:\n${sampleEncounter.assessmentNotes}`,
        plan: "Refer to ophthalmology",
        noteState: "draft",
        confidenceScore: 92,
        accuracyPct: 95,
        alerts: {
          documentation: { plan: "Refer to ophthalmology" },
          rawInput: {
            clientEncounterId: sampleEncounter.id,
            clientPatientId: sampleEncounter.patientId,
          },
        },
      })
      .returning();
    console.log("Inserted SOAP note ID:", soapNoteRow.id);
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test encounter insertion failed:", error);
  }
}

runTest();
