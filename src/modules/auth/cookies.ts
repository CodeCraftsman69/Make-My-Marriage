import "server-only";

import type { NextResponse } from "next/server.js";

import { env } from "@/config/env";

import {
  expiredSessionCookieOptions,
  sessionCookieName,
  sessionCookieOptions,
} from "./cookie-policy.ts";

export function getSessionCookieName(): string {
  return sessionCookieName(env.NODE_ENV);
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date): void {
  response.cookies.set({
    name: getSessionCookieName(),
    value: token,
    ...sessionCookieOptions(env.NODE_ENV, expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    ...expiredSessionCookieOptions(env.NODE_ENV),
  });
}
