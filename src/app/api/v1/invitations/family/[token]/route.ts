import { previewFamilyInvite } from "@/modules/family/family-service.server";
import { ApplicationError, handleApiError, successResponse } from "@/shared/http";
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try { const invite = await previewFamilyInvite((await context.params).token); if (!invite) throw new ApplicationError("NOT_FOUND", "Invitation is unavailable or expired."); return successResponse(invite, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } }); } catch (error) { return handleApiError(error); }
}
