import { NextResponse } from "next/server.js";
import { ZodError } from "zod";

import {
  ApplicationError,
  type ApplicationErrorCode,
  type ErrorFields,
} from "./application-error.ts";

const statusByCode: Record<ApplicationErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function successResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function errorResponse(
  code: ApplicationErrorCode,
  message: string,
  fields?: ErrorFields,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status: statusByCode[code] },
  );
}

function fieldsFromZodError(error: ZodError): ErrorFields {
  const fields: ErrorFields = {};

  for (const issue of error.issues) {
    const field = issue.path.join(".") || "request";
    const current = fields[field];
    fields[field] = current
      ? [...(Array.isArray(current) ? current : [current]), issue.message]
      : issue.message;
  }

  return fields;
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return errorResponse(
      "VALIDATION_ERROR",
      "The request contains invalid data.",
      fieldsFromZodError(error),
    );
  }

  if (error instanceof ApplicationError) {
    return errorResponse(error.code, error.message, error.fields);
  }

  return errorResponse("INTERNAL_ERROR", "An unexpected error occurred.");
}
