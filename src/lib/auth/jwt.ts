import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-random-key-32-chars-long";
const key = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: { id: string; email: string; name: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as { id: string; email: string; name: string; role: string };
  } catch (error) {
    return null;
  }
}
