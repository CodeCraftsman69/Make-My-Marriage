import { z } from "zod";
import { ApplicationError } from "../../shared/http/application-error.ts";
import { relationships } from "./wedding-member-types.ts";
import { type WeddingRole, requireWeddingPermission } from "./permissions.ts";

export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const invitationInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  relationship: z.enum(relationships),
  role: z.enum(["PLANNER", "VIEWER"]).default("VIEWER"),
}).strict();
export type InvitationInput = z.infer<typeof invitationInputSchema>;
export const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
export function requireFamilyOwner(role: string) {
  requireWeddingPermission(role, "manageFamily");
}
export const memberRoleInputSchema = z.object({ role: z.enum(["CO_OWNER", "PLANNER", "VIEWER"]), currentPassword: z.string().min(1).max(128).optional() }).strict();
export const transferOwnershipSchema = z.object({ memberId: z.string().regex(/^[a-fA-F0-9]{24}$/), currentPassword: z.string().min(1).max(128), confirmation: z.literal("TRANSFER_OWNERSHIP") }).strict();
export function assertInvitationAcceptable(invite: { status: string; expiresAt: Date; inviteeEmail: string; acceptedBy?: string | null }, user: { id: string; email: string }, now: Date) {
  if (invite.inviteeEmail !== user.email.trim().toLowerCase()) throw new ApplicationError("FORBIDDEN", "Sign in with the email address this invitation was sent to.");
  if (invite.status === "ACCEPTED" && invite.acceptedBy === user.id) return "ALREADY_ACCEPTED";
  if (invite.status !== "PENDING" || invite.expiresAt <= now) throw new ApplicationError("CONFLICT", "This invitation has expired or is no longer available. Ask the owner for a new invitation.");
  return "ACCEPT";
}

export type FamilyView = {
  role: WeddingRole;
  memberId: string;
  members: { id: string; name: string; email: string; relationship: string; role: WeddingRole; joinedAt: string }[];
  invitations: { id: string; name: string; email: string; relationship: string; role: "PLANNER" | "VIEWER"; status: string; deliveryStatus: string; deliveryError?: string | null; expiresAt: string }[];
};
