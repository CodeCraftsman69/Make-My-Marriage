import "server-only";
import { ObjectId, type ClientSession } from "mongodb";
import { getDatabase, getMongoClient } from "@/infrastructure/db";
import { ApplicationError } from "@/shared/http";
import { normalizeWeddingRole, requireWeddingPermission, type WeddingPermission } from "./permissions";
import type { WeddingMemberDocument } from "./wedding-member-types";

export async function requireWeddingMember(userId: string, weddingId: string, session?: ClientSession) {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(weddingId)) throw new ApplicationError("NOT_FOUND", "Wedding not found.");
  const member = await (await getDatabase()).collection<WeddingMemberDocument>("weddingMembers").findOne({ userId: new ObjectId(userId), weddingId: new ObjectId(weddingId), status: "ACTIVE" }, { session });
  const role = normalizeWeddingRole(member?.role);
  if (!member || !role) throw new ApplicationError("NOT_FOUND", "Wedding not found.");
  return { userId: member.userId, weddingId: member.weddingId, memberId: member._id, role };
}

// All access-sensitive writes share this document lock. Membership changes and
// authorized writes cannot commit using a permission revoked concurrently.
export async function withWeddingAccess<T>(userId: string, weddingId: string, permission: WeddingPermission, run: (access: Awaited<ReturnType<typeof requireWeddingMember>>, session: ClientSession) => Promise<T>) {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(weddingId)) throw new ApplicationError("NOT_FOUND", "Wedding not found.");
  const session = (await getMongoClient()).startSession();
  try {
    return await session.withTransaction(async () => {
      const access = await lockWeddingAccess(userId, weddingId, permission, session);
      return run(access, session);
    });
  } finally { await session.endSession(); }
}
export async function lockWeddingAccess(userId: string, weddingId: string, permission: WeddingPermission, session: ClientSession) {
  const access = await requireWeddingMember(userId, weddingId, session);
  requireWeddingPermission(access.role, permission);
  const result = await (await getDatabase()).collection("weddings").updateOne({ _id: access.weddingId, status: "ACTIVE", deletedAt: null }, { $inc: { accessVersion: 1 } }, { session });
  if (!result.matchedCount) throw new ApplicationError("NOT_FOUND", "Wedding not found.");
  return access;
}
