import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/services/audit.service";
import { verifyToken } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, entity, sessionId, patientId, details } = body;

    if (!action || !entity) {
      return NextResponse.json({ error: "Missing action or entity parameters" }, { status: 400 });
    }

    // 1. Resolve active clinician identity from cookie JWT
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    let performedBy: string | undefined = undefined;
    let role = "unknown";

    if (token) {
      try {
        const payload = await verifyToken(token);
        if (payload) {
          performedBy = (payload as any).id || undefined;
          role = payload.role || "unknown";
        }
      } catch (err) {
        console.warn("Failed to decode token for audit logging:", err);
      }
    }

    // 2. Resolve IP Address and User Agent
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                      req.headers.get("x-real-ip") || 
                      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    // 3. Write audit log entry
    await createAuditLog({
      action,
      entity,
      sessionId,
      patientId,
      details,
      performedBy,
      role,
      ipAddress,
      userAgent,
      doctorId: performedBy, // Set the doctorId context to the logged-in doctor
      outcome: "success",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Audit API route failed:", error);
    return NextResponse.json({ error: "Failed to record audit log" }, { status: 500 });
  }
}
