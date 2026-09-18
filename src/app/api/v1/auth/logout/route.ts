import { authService } from "@/modules/auth/auth-service.server";
import { clearSessionCookie } from "@/modules/auth/cookies";
import { getCurrentSessionToken } from "@/modules/auth/current-user";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { handleApiError, successResponse } from "@/shared/http";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    await authService.logout(await getCurrentSessionToken());
    const response = successResponse({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
