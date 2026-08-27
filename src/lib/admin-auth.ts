import "server-only";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifySessionToken, type AdminSession } from "@/lib/admin-session";

/** Server-side lookup of the current admin session (name + validity).
 * Re-verify this in every server action and route handler — never trust
 * that middleware ran first. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized");
  }
}

/** Same as requireAdmin, but also returns the logged-in name — use this in
 * any action that should record who performed it. */
export async function requireAdminName(): Promise<string> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.name;
}
