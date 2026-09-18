import "server-only";

import { env } from "@/config/env";
import { ApplicationError } from "@/shared/http/application-error.ts";

export function assertTrustedOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  if (origin !== new URL(env.APP_BASE_URL).origin) {
    throw new ApplicationError("FORBIDDEN", "The request origin is not allowed.");
  }
}
