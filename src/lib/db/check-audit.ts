import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../../drizzle/schema";
import { desc } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function check() {
  console.log("Checking recent audit logs...");
  try {
    const list = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(10);
    console.log("Recent audit logs:", list);
  } catch (error) {
    console.error("Failed to query audit logs:", error);
  }
}

check();
