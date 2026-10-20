import { requireAuth } from "@/modules/auth";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { revokeFamilyInvite } from "@/modules/family/family-service.server";
import { handleApiError, successResponse } from "@/shared/http";
export async function POST(request: Request, context: { params: Promise<{ weddingId: string; invitationId: string }> }) {
  try { assertTrustedOrigin(request); const user = await requireAuth(); const { weddingId, invitationId } = await context.params; return successResponse(await revokeFamilyInvite(user, weddingId, invitationId)); } catch (error) { return handleApiError(error); }
}
