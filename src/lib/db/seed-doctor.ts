import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../../drizzle/schema";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth/password";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seedDoctor(email: string, name: string, plainPassword: string, specialization: string, licenseNumber: string) {
  console.log(`Seeding doctor: ${name} (${email})...`);
  const hashedPassword = hashPassword(plainPassword);

  // Check if doctor user already exists
  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  let doctorId: string;

  if (existingUsers.length > 0) {
    console.log(`User ${email} already exists, updating password hash...`);
    const doctor = existingUsers[0];
    await db
      .update(schema.users)
      .set({ passwordHash: hashedPassword, name: name })
      .where(eq(schema.users.email, email));
    doctorId = doctor.id;
  } else {
    console.log(`User ${email} does not exist, inserting new user...`);
    const [doctor] = await db.insert(schema.users).values({
      name: name,
      email: email,
      passwordHash: hashedPassword,
      role: "doctor",
      isActive: true,
    }).returning();
    doctorId = doctor.id;
  }

  // Ensure doctor profile exists or update it
  const existingProfiles = await db
    .select()
    .from(schema.doctorProfiles)
    .where(eq(schema.doctorProfiles.doctorId, doctorId))
    .limit(1);

  if (existingProfiles.length === 0) {
    await db.insert(schema.doctorProfiles).values({
      doctorId: doctorId,
      specialization: specialization,
      clinicHospitalName: "Operyx Memorial Hospital",
      licenseNumber: licenseNumber,
    });
    console.log(`Created doctor profile for ${name}.`);
  } else {
    console.log(`Doctor profile for ${name} already exists.`);
  }
}

async function seed() {
  try {
    // 1. Seed Dr. Sarah Chen
    await seedDoctor(
      "sarah.chen@operyx.ai",
      "Dr. Sarah Chen",
      "demo123",
      "Internal Medicine",
      "LIC-99210-SC"
    );

    // 2. Seed Demo Doctor
    await seedDoctor(
      "demo@operyx.ai",
      "Dr. Demo Doctor",
      "demo123",
      "Family Medicine",
      "LIC-00000-DEMO"
    );

    console.log("All seeding completed successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

seed();
