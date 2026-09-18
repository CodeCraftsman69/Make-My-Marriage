import "server-only";

import { ApplicationError } from "@/shared/http/application-error.ts";

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error: unknown) {
    throw new ApplicationError("VALIDATION_ERROR", "The request body must be valid JSON.", {
      cause: error,
    });
  }
}
