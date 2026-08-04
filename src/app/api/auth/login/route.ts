import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/services/audit.service";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    let authenticatedUser: { id: string; email: string; name: string; role: string } | null = null;

    // 1. Try querying Neon DB users table
    try {
      if (process.env.DATABASE_URL) {
        const dbUsers = await db
          .select()
          .from(users)
          .where(eq(users.email, email.trim().toLowerCase()))
          .limit(1);

        if (dbUsers.length > 0) {
          const user = dbUsers[0];
          const incomingHash = hashPassword(password);
          if (user.passwordHash === incomingHash) {
            authenticatedUser = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        }
      }
    } catch (dbError) {
      console.warn("Database lookup failed:", dbError);
    }

    if (!authenticatedUser) {
      await createAuditLog({
        action: "login",
        entity: "user",
        role: "unknown",
        details: `Failed clinician login attempt for email: ${email}`,
        outcome: "failure",
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signToken(authenticatedUser);

    // Write login audit log
    await createAuditLog({
      action: "login",
      entity: "user",
      role: authenticatedUser.role,
      details: `Successful clinician login for email: ${authenticatedUser.email}`,
      outcome: "success",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: authenticatedUser.role,
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
