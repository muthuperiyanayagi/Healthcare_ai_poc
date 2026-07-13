import type { AuthSession } from "@/lib/types";
import { DEMO_CREDENTIALS } from "@/lib/mock/seed";
import { getSession, setSession } from "@/stores/local-store";
import { randomDelay } from "@/lib/utils";

/** FastAPI-shaped: POST /api/v1/auth/login */
export async function login(email: string, password: string): Promise<AuthSession> {
  await randomDelay(600, 1200);
  if (
    email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
    password !== DEMO_CREDENTIALS.password
  ) {
    throw new Error("Invalid email or password. Use demo@operyx.ai / demo123");
  }
  const session: AuthSession = {
    email: DEMO_CREDENTIALS.email,
    name: "Dr. Sarah Chen",
    role: "Attending Physician",
    loggedInAt: new Date().toISOString(),
  };
  setSession(session);
  return session;
}

/** FastAPI-shaped: POST /api/v1/auth/logout */
export async function logout(): Promise<void> {
  await randomDelay(200, 500);
  setSession(null);
}

/** FastAPI-shaped: GET /api/v1/auth/me */
export async function getCurrentSession(): Promise<AuthSession | null> {
  await randomDelay(150, 400);
  return getSession();
}
