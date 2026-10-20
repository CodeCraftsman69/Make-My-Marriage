import { requireAuth } from "@/modules/auth";
import { getFamily } from "@/modules/family/family-service.server";
import { handleApiError, successResponse } from "@/shared/http";
export async function GET(_request: Request, context: { params: Promise<{ weddingId: string }> }) {
  try { const { weddingId } = await context.params; return successResponse((await getFamily(await requireAuth(), weddingId)).members, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return handleApiError(error); }
}
