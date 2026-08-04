import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../../drizzle/schema";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function test() {
  console.log("Testing insert into audit_logs...");
  try {
    const result = await db.insert(schema.auditLogs).values({
      action: "login",
      entity: "user",
      role: "doctor",
      details: "Test login logging",
      outcome: "success",
      environment: "development",
    }).returning();
    console.log("Insert success:", result);
  } catch (error) {
    console.error("Detailed insert error:", error);
  }
}

test();
