export const applicationErrorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "EMAIL_ALREADY_EXISTS",
  "INVALID_CREDENTIALS",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export type ApplicationErrorCode = (typeof applicationErrorCodes)[number];
export type ErrorFields = Record<string, string | string[]>;

type ApplicationErrorOptions = {
  fields?: ErrorFields;
  cause?: unknown;
};

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;
  readonly fields?: ErrorFields;

  constructor(code: ApplicationErrorCode, message: string, options: ApplicationErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "ApplicationError";
    this.code = code;
    this.fields = options.fields;
  }
}
