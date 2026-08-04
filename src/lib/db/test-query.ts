import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function test() {
  console.log("Simulating encounters fetch query...");
  try {
    const doctorId = "01caf8c4-6c9d-475e-a22e-7d5a830048a3"; // Seeded doctor ID
    const results = await db
      .select({
        session: schema.sessions,
        soapNote: schema.soapNotes,
      })
      .from(schema.sessions)
      .leftJoin(schema.soapNotes, eq(schema.sessions.id, schema.soapNotes.sessionId))
      .where(eq(schema.sessions.doctorId, doctorId))
      .orderBy(desc(schema.sessions.createdAt))
      .offset(0)
      .limit(8);

    console.log("Query success. Found count:", results.length);
  } catch (error) {
    console.error("Query failed with error:", error);
  }
}

test();
