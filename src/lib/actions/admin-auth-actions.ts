"use server";

import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  timingSafeEqual,
} from "@/lib/admin-session";
import { isTeamMember } from "@/lib/team";

export async function loginAdmin(
  name: string,
  pin: string,
): Promise<{ success: true } | { error: string }> {
  const expectedPin = process.env.ADMIN_PIN;
  if (!expectedPin) {
    return { error: "Admin PIN is not configured on the server." };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: "Select your name." };
  }
  if (!isTeamMember(trimmedName)) {
    return { error: "Name not recognized — this tracker is for the Logistics team only." };
  }

  if (!pin || !timingSafeEqual(pin, expectedPin)) {
    return { error: "Incorrect PIN." };
  }

  const token = await createSessionToken(trimmedName);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  return { success: true };
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
