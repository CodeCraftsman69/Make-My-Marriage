import { requireAuth } from "@/modules/auth/current-user";
import { handleApiError, successResponse } from "@/shared/http";

export async function GET() {
  try {
    const response = successResponse({ user: await requireAuth() });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
