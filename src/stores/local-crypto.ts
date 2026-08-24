const SESSION_KEY_STORAGE = "operyx.dek";

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return btoa(String.fromCharCode(...arr));
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/** Key lives only in sessionStorage (cleared on tab/browser close), never
 * alongside the ciphertext in localStorage — so data persisted to disk
 * cannot be decrypted once the browser session ends. */
async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (existing) {
    return crypto.subtle.importKey("raw", fromBase64(existing), "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]);
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
  const raw = await crypto.subtle.exportKey("raw", key);
  sessionStorage.setItem(SESSION_KEY_STORAGE, toBase64(raw));
  return key;
}

export async function encryptForStorage(value: unknown): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `${toBase64(iv)}.${toBase64(ciphertext)}`;
}

export async function decryptFromStorage<T>(payload: string): Promise<T | null> {
  try {
    const [ivB64, dataB64] = payload.split(".");
    if (!ivB64 || !dataB64) return null;
    const key = await getOrCreateKey();
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivB64) },
      key,
      fromBase64(dataB64)
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
  } catch {
    return null;
  }
}
