import { requireAuth } from "@/modules/auth";
import { assertTrustedOrigin } from "@/modules/auth/origin";
import { readJsonBody } from "@/modules/auth/request";
import { getFamily, sendFamilyInvite } from "@/modules/family/family-service.server";
import { invitationInputSchema } from "@/modules/family/invitation-policy";
import { handleApiError, successResponse } from "@/shared/http";
type Context = { params: Promise<{ weddingId: string }> };
export async function GET(_request: Request, context: Context) {
  try { const { weddingId } = await context.params; return successResponse((await getFamily(await requireAuth(), weddingId)).invitations, { headers: { "Cache-Control": "no-store" } }); } catch (error) { return handleApiError(error); }
}
export async function POST(request: Request, context: Context) {
  try { assertTrustedOrigin(request); const user = await requireAuth(); const { weddingId } = await context.params; const input = invitationInputSchema.parse(await readJsonBody(request)); return successResponse(await sendFamilyInvite(user, weddingId, input), { status: 201 }); } catch (error) { return handleApiError(error); }
}
