import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/services/audit.service";
import { verifyToken } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    let email = "unknown";
    let role = "unknown";

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        email = payload.email;
        role = payload.role;
      }
    }

    await createAuditLog({
      action: "logout",
      entity: "user",
      role,
      details: `User logged out successfully: ${email}`,
      outcome: "success",
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("token");
    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
