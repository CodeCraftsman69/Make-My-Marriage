import { requireAuth } from "@/modules/auth";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { removeFamilyMember } from "@/modules/family/family-service.server";
import { handleApiError, successResponse } from "@/shared/http";
import { changeMemberRole } from "@/modules/family/membership-access.server";
import { memberRoleInputSchema } from "@/modules/family/invitation-policy";
import { readJsonBody } from "@/modules/auth/request";
export async function PATCH(request: Request, context: { params: Promise<{ weddingId: string; memberId: string }> }) {
  try { assertTrustedOrigin(request); const user = await requireAuth(); const { weddingId, memberId } = await context.params; const input = memberRoleInputSchema.parse(await readJsonBody(request)); return successResponse(await changeMemberRole(user, weddingId, memberId, input)); } catch (error) { return handleApiError(error); }
}
export async function DELETE(request: Request, context: { params: Promise<{ weddingId: string; memberId: string }> }) {
  try { assertTrustedOrigin(request); const user = await requireAuth(); const { weddingId, memberId } = await context.params; return successResponse(await removeFamilyMember(user, weddingId, memberId)); } catch (error) { return handleApiError(error); }
}
