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

async function check() {
  console.log("Checking database users...");
  try {
    const list = await db.select().from(schema.users);
    console.log("Users in database:", list);
  } catch (error) {
    console.error("Failed to query users:", error);
  }
}

check();
