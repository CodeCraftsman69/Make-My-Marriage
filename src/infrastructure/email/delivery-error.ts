export const deliveryMessages = {
  CONFIGURATION: "Invitation email is not configured. Set a valid RESEND_API_KEY and EMAIL_FROM, and use an HTTPS APP_BASE_URL in production.",
  AUTHENTICATION: "Resend rejected the API key. Set a valid, active RESEND_API_KEY with permission to send from your sender domain, then restart the app.",
  SENDER_DOMAIN: "Resend rejected the sender domain. Verify the domain in Resend and set EMAIL_FROM to an address on that domain.",
  TEST_RECIPIENT: "The Resend test sender can only email your Resend account address. Verify your own sender domain to invite other recipients.",
  RATE_LIMIT: "Resend's email rate limit or quota was reached. Check your Resend usage before retrying.",
  NETWORK: "The app could not connect to Resend. Check the server's network or proxy settings and retry. Delivery could not be confirmed.",
  TIMEOUT: "The request to Resend timed out. Check Resend Logs before resending: the email may already have been submitted.",
  INVALID_REQUEST: "Resend rejected the email request. Check EMAIL_FROM format and the recipient address, then inspect Resend Logs for details.",
  PROVIDER: "Resend could not process the email. Check Resend Logs or service status before retrying.",
} as const;
export type DeliveryFailure = keyof typeof deliveryMessages;
export class EmailDeliveryError extends Error {
  readonly reason: DeliveryFailure;
  constructor(reason: DeliveryFailure) { super(deliveryMessages[reason]); this.name = "EmailDeliveryError"; this.reason = reason; }
}

// Provider messages can contain addresses or other request data. Inspect them to
// classify the failure, but never return, log, or persist the raw response.
export function classifyResendFailure(status: number, body: unknown): DeliveryFailure {
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const name = typeof data.name === "string" ? data.name.toLowerCase() : "";
  const message = typeof data.message === "string" ? data.message.toLowerCase() : "";
  if (message.includes("only send testing emails") || message.includes("testing emails to your own")) return "TEST_RECIPIENT";
  if (message.includes("domain") && (message.includes("not verified") || message.includes("not been verified") || message.includes("not owned") || message.includes("verify"))) return "SENDER_DOMAIN";
  if (status === 429 || name.includes("quota") || name === "rate_limit_exceeded") return "RATE_LIMIT";
  if (status === 401 || name.includes("api_key") || message.includes("api key") || name === "invalid_permission") return "AUTHENTICATION";
  if (status === 400 || status === 403 || status === 422) return "INVALID_REQUEST";
  return "PROVIDER";
}
