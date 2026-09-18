import { createHash, randomBytes } from "node:crypto";

const DEFAULT_TOKEN_BYTES = 32;

export function generateSecureToken(byteLength = DEFAULT_TOKEN_BYTES): string {
  if (!Number.isSafeInteger(byteLength) || byteLength < 16) {
    throw new RangeError("Secure tokens must contain at least 16 random bytes.");
  }

  return randomBytes(byteLength).toString("base64url");
}

export function hashToken(token: string): string {
  if (!token) {
    throw new TypeError("Token is required.");
  }

  return createHash("sha256").update(token, "utf8").digest("hex");
}
