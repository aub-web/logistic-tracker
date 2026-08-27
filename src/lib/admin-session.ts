// Signed, short-lived admin session tokens. Uses Web Crypto (available in
// both the Node.js and Edge runtimes) so this module works from middleware,
// route handlers, and server actions alike.

export const ADMIN_SESSION_COOKIE = "logi_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

export interface AdminSession {
  name: string;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set.");
  }
  return secret;
}

function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padLength = (4 - (value.length % 4)) % 4;
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLength);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Creates a signed token that expires after ADMIN_SESSION_MAX_AGE_SECONDS,
 * carrying the display name entered at login so status changes can be
 * attributed to a person. */
export async function createSessionToken(name: string): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_DURATION_MS, name });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const key = await getKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64),
  );
  return `${payloadB64}.${toBase64Url(signature)}`;
}

/** Verifies signature and expiry of a session token from the admin cookie,
 * returning the decoded session (with the logged-in name) or null. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<AdminSession | null> {
  if (!token) return null;
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getKey();
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signatureB64) as BufferSource,
      new TextEncoder().encode(payloadB64),
    );
    if (!signatureValid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payloadB64)),
    ) as { exp: number; name?: string };

    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;

    return { name: typeof payload.name === "string" && payload.name ? payload.name : "Unknown" };
  } catch {
    return null;
  }
}

/** Constant-time comparison for the admin PIN. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
