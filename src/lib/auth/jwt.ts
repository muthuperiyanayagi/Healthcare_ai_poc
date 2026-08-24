import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-random-key-32-chars-long";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn(
    "JWT_SECRET is not set — falling back to a hardcoded, publicly-visible default. " +
      "Session tokens are forgeable and Epic access tokens are effectively unprotected. " +
      "Set JWT_SECRET before handling anything beyond sandbox test data."
  );
}

// A256GCM requires exactly 32 bytes; hash the configured secret to get there
// reliably regardless of its length, instead of truncating/padding raw bytes.
const key = createHash("sha256").update(JWT_SECRET).digest();

export interface EpicSessionContext {
  fhirBaseUrl: string;
  accessToken: string;
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  expiresAt: number;
}

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  epic?: EpicSessionContext;
}

// Encrypted (JWE), not just signed (JWS): the session payload carries the raw
// Epic access token, so it needs to be unreadable to anything that only has
// the cookie value (logs, error trackers, etc.), not merely tamper-evident.
export async function signToken(payload: SessionPayload) {
  return await new EncryptJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .encrypt(key);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(token, key);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}
