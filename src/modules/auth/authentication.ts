import { ApplicationError } from "../../shared/http/application-error.ts";
import type { SafeUser } from "../users/user-types.ts";

import type { AuthService } from "./auth-service.ts";

export async function resolveAuthenticatedUser(
  token: string | undefined,
  service: AuthService,
): Promise<SafeUser | null> {
  return service.resolveUser(token);
}

export async function requireAuthenticatedUser(
  token: string | undefined,
  service: AuthService,
): Promise<SafeUser> {
  const user = await resolveAuthenticatedUser(token, service);
  if (!user) {
    throw new ApplicationError("UNAUTHENTICATED", "Authentication is required.");
  }
  return user;
}
