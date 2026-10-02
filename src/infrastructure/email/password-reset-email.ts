import "server-only";
import { env } from "@/config/env";

export function isResetEmailConfigured() {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM && (env.NODE_ENV !== "production" || new URL(env.APP_BASE_URL).protocol === "https:"));
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!isResetEmailConfigured()) throw new Error("Reset email is not configured.");
  const url = new URL(`/reset-password/${encodeURIComponent(token)}`, env.APP_BASE_URL);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [email], subject: "Reset your Make My Marriage password", text: `You requested a new password for Make My Marriage.\n\nOpen this link to choose a new password:\n${url.toString()}\n\nThis link expires in 30 minutes and can be used once. Requesting another link replaces this one.\n\nIf you did not request this, you can ignore this email. Your password has not changed.` }),
  });
  if (!response.ok) throw new Error("Password reset email delivery failed.");
}
