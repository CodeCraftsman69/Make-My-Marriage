import { requireAuth } from "@/modules/auth/current-user";
import { handleApiError, successResponse } from "@/shared/http";

export async function GET() {
  try {
    return successResponse({ user: await requireAuth() });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
