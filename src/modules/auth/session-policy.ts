export const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

export function getSessionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_LIFETIME_SECONDS * 1_000);
}
