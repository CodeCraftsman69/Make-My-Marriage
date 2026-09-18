import { SESSION_LIFETIME_SECONDS } from "./session-policy.ts";

const DEVELOPMENT_COOKIE_NAME = "mmm_session";
const PRODUCTION_COOKIE_NAME = "__Host-mmm_session";

export function sessionCookieName(nodeEnv: "development" | "test" | "production"): string {
  return nodeEnv === "production" ? PRODUCTION_COOKIE_NAME : DEVELOPMENT_COOKIE_NAME;
}

export function sessionCookieOptions(
  nodeEnv: "development" | "test" | "production",
  expiresAt: Date,
) {
  return {
    httpOnly: true as const,
    secure: nodeEnv === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_LIFETIME_SECONDS,
    expires: expiresAt,
    priority: "high" as const,
  };
}

export function expiredSessionCookieOptions(nodeEnv: "development" | "test" | "production") {
  return {
    httpOnly: true as const,
    secure: nodeEnv === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}
