import "server-only";

import { cookies } from "next/headers";

import type { SafeUser } from "@/modules/users";

import { requireAuthenticatedUser, resolveAuthenticatedUser } from "./authentication.ts";
import { authService } from "./auth-service.server.ts";
import { getSessionCookieName } from "./cookies.ts";

export async function getCurrentSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(getSessionCookieName())?.value;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  return resolveAuthenticatedUser(await getCurrentSessionToken(), authService);
}

export async function requireAuth(): Promise<SafeUser> {
  return requireAuthenticatedUser(await getCurrentSessionToken(), authService);
}
