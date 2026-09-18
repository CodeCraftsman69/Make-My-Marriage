import { checkDatabaseHealth } from "@/infrastructure/db";
import { handleApiError, successResponse } from "@/shared/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await checkDatabaseHealth();
    return successResponse({ status: "ok" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
