import type { AuthSession } from "@/lib/types";
import { getSession, setSession } from "@/stores/local-store";

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

  const session: AuthSession = await response.json();
  setSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.warn("Backend logout failed, proceeding with client logout:", err);
  }
  setSession(null);
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return getSession();
}
