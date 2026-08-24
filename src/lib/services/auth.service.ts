import type { AuthSession } from "@/lib/types";
import { setSession } from "@/stores/local-store";

/** Connect login system directly to /api/auth/login route */
export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed");
  }

  const { user } = await response.json();
  const session: AuthSession = { ...user, loggedInAt: new Date().toISOString() };
  await setSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.warn("Backend logout failed, proceeding with client logout:", err);
  }
  await setSession(null);
}

/**
 * Source of truth is the server-verified httpOnly cookie (/api/auth/me), not
 * localStorage — the SMART-on-FHIR callback sets that cookie via a server
 * redirect and never gets a chance to write to localStorage directly, so
 * relying on the local cache alone misses any session started that way.
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) {
      await setSession(null);
      return null;
    }
    const data = await response.json();
    if (!data.authenticated || !data.user) {
      await setSession(null);
      return null;
    }
    const session: AuthSession = { ...data.user, loggedInAt: new Date().toISOString() };
    await setSession(session);
    return session;
  } catch (err) {
    console.warn("Failed to verify session with server:", err);
    return null;
  }
}
