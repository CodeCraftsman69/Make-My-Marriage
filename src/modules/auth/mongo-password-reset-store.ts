import "server-only";
import { ObjectId } from "mongodb";
import { getDatabase, getMongoClient } from "@/infrastructure/db";
import type { UserDocument } from "@/modules/users/user-types";
import type { ResetStore } from "./password-reset-service";

type ResetToken = { _id: ObjectId; userId: ObjectId; tokenHash: string; createdAt: Date; expiresAt: Date; usedAt: Date | null };
type RequestLimit = { _id: string; count: number; expiresAt: Date };
let indexes: Promise<void> | undefined;
async function collections() {
  const db = await getDatabase();
  const tokens = db.collection<ResetToken>("passwordResetTokens");
  const limits = db.collection<RequestLimit>("passwordResetRequestLimits");
  indexes ??= Promise.all([
    tokens.createIndex({ tokenHash: 1 }, { unique: true }),
    tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).then(() => {}).catch(error => { indexes = undefined; throw error; });
  await indexes;
  return { db, tokens, limits };
}

export class MongoPasswordResetStore implements ResetStore {
  async allowRequest(emailHash: string, now: Date) {
    const windowMs = 15 * 60 * 1000;
    const window = Math.floor(now.getTime() / windowMs);
    const { limits } = await collections();
    const result = await limits.findOneAndUpdate({ _id: `${emailHash}:${window}` }, {
      $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) },
    }, { upsert: true, returnDocument: "after" });
    return Boolean(result && result.count <= 3);
  }
  async findActiveUser(email: string) {
    const { db } = await collections();
    const user = await db.collection<UserDocument>("users").findOne({ normalizedEmail: email, status: "ACTIVE" });
    return user ? { id: user._id.toHexString(), email: user.email } : null;
  }
  async save(userId: string, tokenHash: string, now: Date, expiresAt: Date) {
    const { tokens } = await collections();
    // Using the user ID as the primary key permits only one current link per account.
    await tokens.updateOne({ _id: new ObjectId(userId) }, { $set: { userId: new ObjectId(userId), tokenHash, createdAt: now, expiresAt, usedAt: null } }, { upsert: true });
  }
  async isValid(tokenHash: string, now: Date) {
    const { tokens } = await collections();
    return Boolean(await tokens.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: now } }));
  }
  async consumeAndChangePassword(tokenHash: string, passwordHash: string, now: Date) {
    const { db, tokens } = await collections();
    const session = (await getMongoClient()).startSession();
    try {
      return await session.withTransaction(async () => {
        const token = await tokens.findOne({ tokenHash, usedAt: null, expiresAt: { $gt: now } }, { session });
        if (!token) return false;
        const result = await db.collection<UserDocument>("users").updateOne({ _id: token.userId, status: "ACTIVE" }, { $set: { passwordHash, updatedAt: now } }, { session });
        if (!result.matchedCount) return false;
        await tokens.updateOne({ _id: token._id }, { $set: { usedAt: now } }, { session });
        await db.collection("sessions").deleteMany({ userId: token.userId }, { session });
        return true;
      }) ?? false;
    } finally { await session.endSession(); }
  }
}
