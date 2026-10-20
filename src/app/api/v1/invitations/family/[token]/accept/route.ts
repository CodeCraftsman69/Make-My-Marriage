import { requireAuth } from "@/modules/auth";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { acceptFamilyInvite } from "@/modules/family/family-service.server";
import { handleApiError, successResponse } from "@/shared/http";
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertTrustedOrigin(request);
    const result = await acceptFamilyInvite(await requireAuth(), (await context.params).token);
    const response = successResponse(result, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set("mmm-wedding", result.weddingId, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) { return handleApiError(error); }
}
