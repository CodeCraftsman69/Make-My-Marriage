import { registerSchema } from "@/modules/auth/auth-schemas";
import { authService } from "@/modules/auth/auth-service.server";
import { setSessionCookie } from "@/modules/auth/cookies";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { readJsonBody } from "@/modules/auth/request";
import { handleApiError, successResponse } from "@/shared/http";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const input = registerSchema.parse(await readJsonBody(request));
    const result = await authService.register(input);
    const response = successResponse({ user: result.user }, { status: 201 });
    setSessionCookie(response, result.session.token, result.session.expiresAt);
    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
