import { resetPasswordSchema } from "@/modules/auth/auth-schemas";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { readJsonBody } from "@/modules/auth/request";
import { passwordResetService } from "@/modules/auth/password-reset.server";
import { clearSessionCookie } from "@/modules/auth/cookies";
import { handleApiError, successResponse } from "@/shared/http";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const { token, password } = resetPasswordSchema.parse(await readJsonBody(request));
    await passwordResetService.reset(token, password);
    const response = successResponse({ message: "Your password has been reset. Sign in with your new password." }, { headers: { "Cache-Control": "no-store" } });
    clearSessionCookie(response);
    return response;
  } catch (error) { return handleApiError(error); }
}
