import "server-only";
import { ObjectId, type ClientSession } from "mongodb";
import { getDatabase } from "@/infrastructure/db";
import { confirmUserPassword } from "@/modules/auth";
import type { SafeUser, UserDocument } from "@/modules/users/user-types";
import { ApplicationError } from "@/shared/http";
import { requireWeddingMember, withWeddingAccess } from "./authorization";
import { canChangeMemberRole, canRemoveMember, normalizeWeddingRole, permissionsForRole, requireWeddingPermission } from "./permissions";
import type { WeddingMemberDocument } from "./wedding-member-types";
import { memberRoleInputSchema, transferOwnershipSchema } from "./invitation-policy";

async function targetMember(weddingId: ObjectId, memberId: string, session: ClientSession) {
  if (!ObjectId.isValid(memberId)) throw new ApplicationError("NOT_FOUND", "Member not found.");
  const member = await (await getDatabase()).collection<WeddingMemberDocument>("weddingMembers").findOne({ _id: new ObjectId(memberId), weddingId, status: "ACTIVE" }, { session });
  if (!member || !normalizeWeddingRole(member.role)) throw new ApplicationError("NOT_FOUND", "Member not found.");
  return member;
}
async function audit(weddingId: ObjectId, actorId: string, target: WeddingMemberDocument, action: string, nextRole: string | null, session: ClientSession) {
  await (await getDatabase()).collection("familyAccessAudit").insertOne({ weddingId, actorId: new ObjectId(actorId), memberId: target._id, action, previousRole: normalizeWeddingRole(target.role), nextRole, createdAt: new Date() }, { session });
}
async function revokeIssuedInvitations(weddingId: ObjectId, userId: ObjectId, session: ClientSession) {
  await (await getDatabase()).collection("familyInvitations").updateMany({ weddingId, invitedBy: userId, status: "PENDING" }, { $set: { status: "REVOKED", updatedAt: new Date() } }, { session });
}
export async function removeFamilyMember(user: SafeUser, weddingId: string, memberId: string) {
  return withWeddingAccess(user.id, weddingId, "manageFamily", async (access, session) => {
    const target = await targetMember(access.weddingId, memberId, session);
    if (!canRemoveMember(access.role, target.role, target.relationship, target.userId.equals(access.userId))) throw new ApplicationError("FORBIDDEN", "Owners, co-owners, the bride and groom, and your own membership cannot be removed.");
    const db = await getDatabase();
    await db.collection<WeddingMemberDocument>("weddingMembers").updateOne({ _id: target._id, weddingId: access.weddingId, status: "ACTIVE", role: target.role }, { $set: { status: "INACTIVE", updatedAt: new Date() } }, { session });
    await revokeIssuedInvitations(access.weddingId, target.userId, session);
    const person = await db.collection<UserDocument>("users").findOne({ _id: target.userId }, { session });
    if (person) await db.collection("familyInvitations").updateMany({ weddingId: access.weddingId, inviteeEmail: person.normalizedEmail, status: "PENDING" }, { $set: { status: "REVOKED", updatedAt: new Date() } }, { session });
    await audit(access.weddingId, user.id, target, "MEMBER_REMOVED", null, session);
    return { message: "Member removed from this wedding." };
  });
}
export async function changeMemberRole(user: SafeUser, weddingId: string, memberId: string, raw: unknown) {
  const input = memberRoleInputSchema.parse(raw);
  const initial = await requireWeddingMember(user.id, weddingId);
  requireWeddingPermission(initial.role, "manageFamily");
  // Reauthentication is required for any change involving co-ownership. Recheck
  // the target and actor under the transaction lock before applying the change.
  const db = await getDatabase();
  const before = ObjectId.isValid(memberId) ? await db.collection<WeddingMemberDocument>("weddingMembers").findOne({ _id: new ObjectId(memberId), weddingId: initial.weddingId, status: "ACTIVE" }) : null;
  if (!before) throw new ApplicationError("NOT_FOUND", "Member not found.");
  if (!canChangeMemberRole(initial.role, before.role, input.role, before.userId.equals(initial.userId))) throw new ApplicationError("FORBIDDEN", "You cannot change this member’s role. Ownership needs an explicit transfer.");
  const confirmed = input.role === "CO_OWNER" || before.role === "CO_OWNER";
  if (confirmed) await confirmUserPassword(user.id, input.currentPassword);
  return withWeddingAccess(user.id, weddingId, "manageFamily", async (access, session) => {
    const target = await targetMember(access.weddingId, memberId, session);
    if (!canChangeMemberRole(access.role, target.role, input.role, target.userId.equals(access.userId))) throw new ApplicationError("FORBIDDEN", "You cannot change this member’s role.");
    if ((target.role === "CO_OWNER" || input.role === "CO_OWNER") && !confirmed) throw new ApplicationError("CONFLICT", "Access changed. Refresh and confirm your password again.");
    const person = await db.collection<UserDocument>("users").findOne({ _id: target.userId, status: "ACTIVE" }, { session });
    if (!person) throw new ApplicationError("CONFLICT", "This account is not active.");
    await db.collection<WeddingMemberDocument>("weddingMembers").updateOne({ _id: target._id, weddingId: access.weddingId, status: "ACTIVE" }, { $set: { role: input.role, updatedAt: new Date() } }, { session });
    if (permissionsForRole(target.role).manageFamily && !permissionsForRole(input.role).manageFamily) await revokeIssuedInvitations(access.weddingId, target.userId, session);
    await audit(access.weddingId, user.id, target, "ROLE_CHANGED", input.role, session);
    return { message: "Access role updated. New permissions apply to subsequent requests." };
  });
}
export async function transferWeddingOwnership(user: SafeUser, weddingId: string, raw: unknown) {
  const input = transferOwnershipSchema.parse(raw);
  const initial = await requireWeddingMember(user.id, weddingId);
  requireWeddingPermission(initial.role, "manageOwnership");
  await confirmUserPassword(user.id, input.currentPassword);
  return withWeddingAccess(user.id, weddingId, "manageOwnership", async (access, session) => {
    const target = await targetMember(access.weddingId, input.memberId, session);
    if (target.role !== "CO_OWNER" || target.userId.equals(access.userId)) throw new ApplicationError("CONFLICT", "Transfer ownership to a different active co-owner.");
    const db = await getDatabase();
    if (!await db.collection<UserDocument>("users").findOne({ _id: target.userId, status: "ACTIVE" }, { session })) throw new ApplicationError("CONFLICT", "The new owner's account must be active.");
    const members = db.collection<WeddingMemberDocument>("weddingMembers");
    const owners = await members.find({ weddingId: access.weddingId, role: "OWNER", status: "ACTIVE" }, { session }).toArray();
    if (owners.length !== 1 || !owners[0]._id.equals(access.memberId)) throw new ApplicationError("CONFLICT", "Ownership records need review before a transfer can proceed.");
    // Both changes commit together: never zero owners, never two primary owners.
    const former = await members.updateOne({ _id: access.memberId, weddingId: access.weddingId, role: "OWNER", status: "ACTIVE" }, { $set: { role: "PLANNER", updatedAt: new Date() } }, { session });
    const next = await members.updateOne({ _id: target._id, weddingId: access.weddingId, role: "CO_OWNER", status: "ACTIVE" }, { $set: { role: "OWNER", updatedAt: new Date() } }, { session });
    if (!former.matchedCount || !next.matchedCount) throw new ApplicationError("CONFLICT", "Ownership changed. Refresh and try again.");
    await revokeIssuedInvitations(access.weddingId, access.userId, session);
    await audit(access.weddingId, user.id, target, "OWNERSHIP_TRANSFERRED", "OWNER", session);
    return { message: "Ownership transferred. Your role is now Planner." };
  });
}
