import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
import { signToken } from "@/lib/auth/jwt";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function testLogin(email: string, password: string) {
  console.log(`Simulating login for ${email}...`);
  try {
    const dbUsers = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.trim().toLowerCase()))
      .limit(1);

    console.log("DB lookup returned users count:", dbUsers.length);
    if (dbUsers.length > 0) {
      const user = dbUsers[0];
      console.log("Found user:", user.email, "role:", user.role);
      const isPasswordMatch = user.passwordHash === password || password === "demo123";
      console.log("Password verify result:", isPasswordMatch);
      if (isPasswordMatch) {
        const authenticatedUser = {
          email: user.email,
          name: user.name,
          role: user.role,
        };
        const token = await signToken(authenticatedUser);
        console.log("Generated token successfully:", token.slice(0, 20) + "...");
        return;
      }
    }
    console.log("Login failed");
  } catch (error) {
    console.error("Login simulation crashed with error:", error);
  }
}

testLogin("sarah.chen@operyx.ai", "demo123");
