import { db } from "@/lib/db";
import { auditLogs } from "../../../drizzle/schema";
import { createHash } from "crypto";

export interface CreateAuditLogInput {
  sessionId?: string;
  action: string;
  entity: string;
  performedBy?: string;
  role: string;
  details?: string;
  doctorId?: string;
  patientId?: string;
  soapNoteId?: string;
  ipAddress?: string;
  userAgent?: string;
  outcome: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  targetUserId?: string;
  exportType?: string;
  recordCount?: number;
  exportScope?: string;
  requestId?: string;
}

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

/**
 * Inserts a HIPAA-compliant audit log entry into the Neon DB audit_logs table.
 * Falls back gracefully to console warning in dev mode if database is offline.
 */
export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    if (process.env.DATABASE_URL) {
      await db.insert(auditLogs).values({
        sessionId: input.sessionId ? toUuid(input.sessionId) : null,
        action: input.action,
        entity: input.entity,
        performedBy: input.performedBy,
        role: input.role,
        details: input.details,
        doctorId: input.doctorId ? toUuid(input.doctorId) : null,
        patientId: input.patientId ? toUuid(input.patientId) : null,
        soapNoteId: input.soapNoteId ? toUuid(input.soapNoteId) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        outcome: input.outcome,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        targetUserId: input.targetUserId ? toUuid(input.targetUserId) : null,
        exportType: input.exportType,
        recordCount: input.recordCount,
        exportScope: input.exportScope,
        requestId: input.requestId,
        environment: process.env.NODE_ENV || "development",
      });
    } else {
      console.log(`[HIPAA Audit Log] Action: ${input.action} | Entity: ${input.entity} | Outcome: ${input.outcome}`);
    }
  } catch (error) {
    console.error("Failed to write HIPAA audit log to database:", error);
  }
}
