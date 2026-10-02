import { forgotPasswordSchema } from "@/modules/auth/auth-schemas";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { readJsonBody } from "@/modules/auth/request";
import { passwordResetService } from "@/modules/auth/password-reset.server";
import { RESET_REQUEST_MESSAGE } from "@/modules/auth/password-reset-service";
import { isResetEmailConfigured } from "@/infrastructure/email/password-reset-email";
import { handleApiError, successResponse } from "@/shared/http";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { email } = forgotPasswordSchema.parse(await readJsonBody(request));
    if (!isResetEmailConfigured()) return Response.json({ error: { code: "SERVICE_UNAVAILABLE", message: "Password reset is temporarily unavailable. Please try again later." } }, { status: 503 });
    try { await passwordResetService.request(email); }
    catch { console.error("Password reset request failed. Check database and email service availability."); }
    // Delivery failures must not disclose that an account exists.
    return successResponse({ message: RESET_REQUEST_MESSAGE }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return handleApiError(error); }
}
