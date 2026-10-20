import "server-only";
import { env } from "@/config/env";
import { classifyResendFailure, EmailDeliveryError } from "./delivery-error";

export function assertFamilyEmailConfigured() {
  if (!env.RESEND_API_KEY?.trim() || /your_api_key|placeholder/i.test(env.RESEND_API_KEY) || !env.EMAIL_FROM?.trim() || /@example\.com\b/i.test(env.EMAIL_FROM) || (env.NODE_ENV === "production" && new URL(env.APP_BASE_URL).protocol !== "https:")) {
    throw new EmailDeliveryError("CONFIGURATION");
  }
}
export async function sendFamilyInvitationEmail(input: { email: string; name: string; inviter: string; wedding: string; token: string; role?: "VIEWER" | "PLANNER" }) {
  assertFamilyEmailConfigured();
  const url = new URL(`/join/${encodeURIComponent(input.token)}`, env.APP_BASE_URL);
  const accessDescription = input.role === "PLANNER" ? "Planner — collaborate on planning without changing core wedding details or managing access." : "Viewer — read-only wedding access.";
  let response: Response;
  try { response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [input.email], subject: "You're invited to plan a wedding on Make My Marriage", text: `Hi ${input.name},\n\n${input.inviter} invited you to help plan ${input.wedding}.\n\nJoin the private family workspace:\n${url}\n\nSign in or create an account using ${input.email}, then accept the invitation. This link expires in seven days and can be used once. If a new invitation is sent, use the latest link.\n\nYour access: ${accessDescription}\n\nIf you weren't expecting this invitation, you can ignore it.` }),
  }); } catch (error) {
    const name = error instanceof Error ? error.name : "";
    throw new EmailDeliveryError(name === "TimeoutError" || name === "AbortError" ? "TIMEOUT" : "NETWORK");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new EmailDeliveryError(classifyResendFailure(response.status, body));
  }
}
