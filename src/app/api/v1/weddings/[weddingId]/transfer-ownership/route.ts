import { requireAuth } from "@/modules/auth";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { readJsonBody } from "@/modules/auth/request";
import { transferWeddingOwnership } from "@/modules/family/membership-access.server";
import { transferOwnershipSchema } from "@/modules/family/invitation-policy";
import { handleApiError, successResponse } from "@/shared/http";
export async function POST(request: Request, context: { params: Promise<{ weddingId: string }> }) {
  try { assertTrustedOrigin(request); const user = await requireAuth(); const { weddingId } = await context.params; const input = transferOwnershipSchema.parse(await readJsonBody(request)); return successResponse(await transferWeddingOwnership(user, weddingId, input)); } catch (error) { return handleApiError(error); }
}
