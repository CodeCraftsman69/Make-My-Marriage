import "server-only";
import { generateSecureToken, hashToken } from "@/shared/security/tokens";
import { ObjectId, type ClientSession } from "mongodb";
import { getDatabase, getMongoClient } from "@/infrastructure/db";
import { assertFamilyEmailConfigured, sendFamilyInvitationEmail } from "@/infrastructure/email/family-invitation-email";
import { EmailDeliveryError } from "@/infrastructure/email/delivery-error";
import type { SafeUser, UserDocument } from "@/modules/users/user-types";
import type { WeddingDocument } from "@/modules/weddings/wedding-types";
import { ApplicationError } from "@/shared/http";
import { lockWeddingAccess, requireWeddingMember, withWeddingAccess } from "./authorization";
import { normalizeWeddingRole, permissionsForRole } from "./permissions";
import { ensureWeddingMemberIndexes } from "./ensure-indexes";
import type { WeddingMemberDocument } from "./wedding-member-types";
import { assertInvitationAcceptable, INVITE_LIFETIME_MS, invitationTokenSchema, requireFamilyOwner, type FamilyView, type InvitationInput } from "./invitation-policy";

type Invitation = {
  _id: ObjectId; weddingId: ObjectId; invitedBy: ObjectId; inviteeName: string; inviteeEmail: string;
  relationship: WeddingMemberDocument["relationship"]; tokenHash: string;
  role?: "PLANNER" | "VIEWER";
  deliveryError?: string | null;
  status: "PENDING" | "ACCEPTED" | "REVOKED"; deliveryStatus: "SENDING" | "SENT" | "FAILED";
  expiresAt: Date; acceptedBy: ObjectId | null; acceptedAt: Date | null; createdAt: Date; updatedAt: Date;
};
const id = (value: string) => { if (!ObjectId.isValid(value)) throw new ApplicationError("NOT_FOUND", "Resource not found."); return new ObjectId(value); };
let indexes: Promise<unknown> | undefined;
async function collections() {
  const db = await getDatabase();
  const invitations = db.collection<Invitation>("familyInvitations");
  const members = db.collection<WeddingMemberDocument>("weddingMembers");
  const limits = db.collection<{ _id: string; count: number; expiresAt: Date }>("familyInvitationLimits");
  indexes ??= Promise.all([
    invitations.createIndex({ tokenHash: 1 }, { unique: true }),
    invitations.createIndex({ weddingId: 1, inviteeEmail: 1 }, { unique: true }),
    limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ensureWeddingMemberIndexes(),
  ]).catch(error => { indexes = undefined; throw error; });
  await indexes;
  return { db, invitations, members, limits };
}
async function activeWedding(weddingId: ObjectId, session?: ClientSession) {
  const { db } = await collections();
  const wedding = await db.collection<WeddingDocument>("weddings").findOne({ _id: weddingId, deletedAt: null, status: "ACTIVE" }, { session });
  if (!wedding) throw new ApplicationError("NOT_FOUND", "Wedding not found.");
  return wedding;
}

export async function getFamily(user: SafeUser, weddingId: string): Promise<FamilyView> {
  const access = await requireWeddingMember(user.id, weddingId);
  await activeWedding(access.weddingId);
  const { db, members, invitations } = await collections();
  const records = await members.find({ weddingId: access.weddingId, status: "ACTIVE" }).sort({ joinedAt: 1 }).toArray();
  const users = await db.collection<UserDocument>("users").find({ _id: { $in: records.map(member => member.userId) } }).toArray();
  const manages = permissionsForRole(access.role).manageFamily;
  const pending = manages ? await invitations.find({ weddingId: access.weddingId }).sort({ createdAt: -1 }).toArray() : [];
  return {
    role: access.role,
    memberId: access.memberId.toHexString(),
    members: records.map(member => { const person = users.find(value => value._id.equals(member.userId)); return { id: member._id.toHexString(), name: person?.name ?? "Family member", email: manages ? person?.email ?? "" : "", relationship: member.relationship, role: normalizeWeddingRole(member.role) ?? "VIEWER", joinedAt: member.joinedAt.toISOString() }; }),
    invitations: pending.map(invite => ({ id: invite._id.toHexString(), name: invite.inviteeName, email: invite.inviteeEmail, relationship: invite.relationship, role: invite.role ?? "VIEWER", status: invite.status === "PENDING" && invite.expiresAt <= new Date() ? "EXPIRED" : invite.status, deliveryStatus: invite.deliveryStatus, deliveryError: invite.deliveryError ?? null, expiresAt: invite.expiresAt.toISOString() })),
  };
}

export async function sendFamilyInvite(user: SafeUser, weddingId: string, input: InvitationInput, resendId?: string) {
  const access = await requireWeddingMember(user.id, weddingId);
  requireFamilyOwner(access.role);
  const wedding = await activeWedding(access.weddingId);
  try { assertFamilyEmailConfigured(); } catch (error) { throw new ApplicationError("INTERNAL_ERROR", error instanceof EmailDeliveryError ? error.message : "Invitation email is unavailable. Please contact support."); }
  const { db, invitations, members, limits } = await collections();
  const now = new Date();
  const window = Math.floor(now.getTime() / 3_600_000);
  const limit = await limits.findOneAndUpdate({ _id: `${user.id}:${window}` }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * 3_600_000) } }, { upsert: true, returnDocument: "after" });
  if (!limit || limit.count > 20) throw new ApplicationError("RATE_LIMITED", "You have sent several invitations. Please try again in an hour.");
  const person = await db.collection<UserDocument>("users").findOne({ normalizedEmail: input.email });
  if (person && await members.findOne({ weddingId: access.weddingId, userId: person._id, status: "ACTIVE" })) throw new ApplicationError("CONFLICT", "This person is already a member.");
  const previous = await invitations.findOne({ weddingId: access.weddingId, inviteeEmail: input.email });
  if (resendId && (!previous || !previous._id.equals(id(resendId)) || previous.status === "ACCEPTED")) throw new ApplicationError("NOT_FOUND", "Invitation not found.");
  if (!resendId && previous?.status === "PENDING" && previous.expiresAt > now) throw new ApplicationError("CONFLICT", "An invitation already exists. Use Resend to send a new link.");
  if (previous && now.getTime() - previous.updatedAt.getTime() < 60_000) throw new ApplicationError("RATE_LIMITED", "Please wait a minute before sending another invitation to this person.");
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const record = { weddingId: access.weddingId, invitedBy: access.userId, inviteeName: input.name, inviteeEmail: input.email, relationship: input.relationship, role: input.role ?? "VIEWER", tokenHash, status: "PENDING" as const, deliveryStatus: "SENDING" as const, deliveryError: null, expiresAt: new Date(now.getTime() + INVITE_LIFETIME_MS), acceptedBy: null, acceptedAt: null, updatedAt: now };
  let invitationId: ObjectId;
  try {
    invitationId = (await withWeddingAccess(user.id, weddingId, "manageFamily", async (_access, session) => {
      if (person && await members.findOne({ weddingId: access.weddingId, userId: person._id, status: "ACTIVE" }, { session })) throw new ApplicationError("CONFLICT", "This person is already a member.");
      if (previous) {
        const updated = await invitations.findOneAndUpdate({ _id: previous._id, tokenHash: previous.tokenHash, status: previous.status, updatedAt: previous.updatedAt }, { $set: record }, { returnDocument: "after", session });
        if (!updated) throw new ApplicationError("CONFLICT", "Invitation changed. Refresh and try again.");
        return updated._id;
      }
      return (await invitations.insertOne({ ...record, _id: new ObjectId(), createdAt: now }, { session })).insertedId;
    }))!;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new ApplicationError("CONFLICT", "An invitation already exists. Refresh the family page.");
    throw error;
  }
  try {
    await sendFamilyInvitationEmail({ email: input.email, name: input.name, inviter: user.name, wedding: wedding.title, token, role: record.role });
  } catch (error) {
    const message = error instanceof EmailDeliveryError ? error.message : "We couldn't confirm email delivery. Refresh the list and use Resend after a minute.";
    try { await invitations.updateOne({ _id: invitationId, tokenHash }, { $set: { deliveryStatus: "FAILED", deliveryError: message } }); }
    catch { console.warn("Invitation email failure status could not be persisted."); }
    throw new ApplicationError(error instanceof EmailDeliveryError && error.reason === "RATE_LIMIT" ? "RATE_LIMITED" : "INTERNAL_ERROR", message);
  }
  // Provider submission and database status persistence are separate outcomes.
  // Never call a submitted email a delivery failure or encourage immediate rotation.
  try { await invitations.updateOne({ _id: invitationId, tokenHash }, { $set: { deliveryStatus: "SENT", deliveryError: null } }); }
  catch { console.warn("Invitation email submitted; delivery status persistence failed."); return { message: "Invitation email was submitted, but its status could not be saved. Check Resend Logs before resending." }; }
  return { message: "Invitation email sent. The link expires in seven days." };
}

export async function resendFamilyInvite(user: SafeUser, weddingId: string, invitationId: string) {
  const access = await requireWeddingMember(user.id, weddingId); requireFamilyOwner(access.role);
  const { invitations } = await collections();
  const invite = await invitations.findOne({ _id: id(invitationId), weddingId: access.weddingId });
  if (!invite) throw new ApplicationError("NOT_FOUND", "Invitation not found.");
  return sendFamilyInvite(user, weddingId, { name: invite.inviteeName, email: invite.inviteeEmail, relationship: invite.relationship, role: invite.role ?? "VIEWER" }, invitationId);
}
export async function revokeFamilyInvite(user: SafeUser, weddingId: string, invitationId: string) {
  const access = await requireWeddingMember(user.id, weddingId); requireFamilyOwner(access.role);
  const { invitations } = await collections();
  const result = await withWeddingAccess(user.id, weddingId, "manageFamily", async (_access, session) => invitations.updateOne({ _id: id(invitationId), weddingId: access.weddingId, status: "PENDING" }, { $set: { status: "REVOKED", updatedAt: new Date() } }, { session }));
  if (!result?.matchedCount) throw new ApplicationError("CONFLICT", "This invitation can no longer be cancelled.");
  return { message: "Invitation cancelled." };
}
export { removeFamilyMember } from "./membership-access.server";

export async function previewFamilyInvite(token: string, user?: SafeUser | null) {
  if (!invitationTokenSchema.safeParse(token).success) return null;
  const { invitations, db, members } = await collections();
  const invite = await invitations.findOne({ tokenHash: hashToken(token) });
  if (!invite) return null;
  if (invite.status === "ACCEPTED") {
    // A consumed bearer link no longer discloses information publicly. An existing
    // active member may still reopen it without recreating or restoring access.
    if (!user || invite.acceptedBy?.toHexString() !== user.id || invite.inviteeEmail !== user.email.trim().toLowerCase()) return null;
    if (!await members.findOne({ weddingId: invite.weddingId, userId: id(user.id), status: "ACTIVE" })) return null;
  }
  // Do not disclose wedding information for revoked or expired tokens.
  if (invite.status === "REVOKED" || (invite.status !== "ACCEPTED" && invite.expiresAt <= new Date())) return null;
  const wedding = await activeWedding(invite.weddingId).catch(error => { if (error instanceof ApplicationError && error.code === "NOT_FOUND") return null; throw error; });
  if (!wedding) return null;
  const inviter = await db.collection<UserDocument>("users").findOne({ _id: invite.invitedBy });
  return { wedding: wedding.title, inviter: inviter?.name ?? "Your family", relationship: invite.relationship, role: invite.role ?? "VIEWER", status: invite.status, wrongAccount: Boolean(user && user.email.trim().toLowerCase() !== invite.inviteeEmail) };
}
export async function acceptFamilyInvite(user: SafeUser, token: string) {
  invitationTokenSchema.parse(token);
  const { invitations, members } = await collections();
  const session = (await getMongoClient()).startSession();
  try {
    const weddingId = await session.withTransaction(async () => {
      const now = new Date();
      const invite = await invitations.findOne({ tokenHash: hashToken(token) }, { session });
      if (!invite) throw new ApplicationError("NOT_FOUND", "Invitation not found. Ask the owner for a new invitation.");
      const action = assertInvitationAcceptable({ ...invite, acceptedBy: invite.acceptedBy?.toHexString() }, user, now);
      await activeWedding(invite.weddingId, session);
      const userId = id(user.id);
      if (action === "ALREADY_ACCEPTED") {
        if (!await members.findOne({ weddingId: invite.weddingId, userId, status: "ACTIVE" }, { session })) throw new ApplicationError("FORBIDDEN", "Your wedding access was removed. Ask the owner for a new invitation.");
        return invite.weddingId.toHexString();
      }
      // Acceptance is serialized against demotion, removal and ownership transfer.
      await lockWeddingAccess(invite.invitedBy.toHexString(), invite.weddingId.toHexString(), "manageFamily", session);
      if (invite.role && invite.role !== "VIEWER" && invite.role !== "PLANNER") throw new ApplicationError("CONFLICT", "This invitation has an invalid access role. Ask for a new invitation.");
      const existing = await members.findOne({ weddingId: invite.weddingId, userId }, { session });
      if (existing?.status === "ACTIVE") throw new ApplicationError("CONFLICT", "You are already a member. Open your wedding workspace instead.");
      // The transaction and unique (weddingId,userId) index make acceptance atomic and retry-safe.
      await members.updateOne({ weddingId: invite.weddingId, userId }, {
        $set: { status: "ACTIVE", role: invite.role ?? "VIEWER", relationship: invite.relationship, invitedBy: invite.invitedBy, joinedAt: now, updatedAt: now },
        $setOnInsert: { createdAt: now },
      }, { upsert: true, session });
      const consumed = await invitations.updateOne({ _id: invite._id, tokenHash: invite.tokenHash, status: "PENDING", expiresAt: { $gt: now } }, { $set: { status: "ACCEPTED", acceptedBy: userId, acceptedAt: now, updatedAt: now } }, { session });
      if (!consumed.matchedCount) throw new ApplicationError("CONFLICT", "Invitation is no longer available.");
      return invite.weddingId.toHexString();
    });
    return { weddingId: weddingId! };
  } finally { await session.endSession(); }
}
