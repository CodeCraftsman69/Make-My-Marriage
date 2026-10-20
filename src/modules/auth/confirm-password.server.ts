import "server-only";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/infrastructure/db";
import { MongoUserRepository } from "@/modules/users/mongo-user-repository";
import { ApplicationError } from "@/shared/http";
import { verifyPassword } from "./password";

export async function confirmUserPassword(userId: string, password?: string) {
  if (!password) throw new ApplicationError("VALIDATION_ERROR", "Enter your current password to confirm this ownership change.");
  const now = Date.now(), window = Math.floor(now / 900_000);
  const limits = (await getDatabase()).collection<{ _id: string; count: number; expiresAt: Date }>("ownershipConfirmationLimits");
  await limits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const attempt = await limits.findOneAndUpdate({ _id: `${userId}:${window}` }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * 900_000) } }, { upsert: true, returnDocument: "after" });
  if (!attempt || attempt.count > 5) throw new ApplicationError("RATE_LIMITED", "Too many ownership confirmation attempts. Try again in 15 minutes.");
  const user = await new MongoUserRepository().findById(new ObjectId(userId));
  if (!user || user.status !== "ACTIVE" || !await verifyPassword(user.passwordHash, password)) throw new ApplicationError("INVALID_CREDENTIALS", "Your current password is incorrect.");
}
