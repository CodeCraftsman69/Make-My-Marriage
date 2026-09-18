import type { ObjectId } from "mongodb";

export const userStatuses = ["ACTIVE", "DISABLED"] as const;

export type UserStatus = (typeof userStatuses)[number];

export type UserDocument = {
  _id: ObjectId;
  name: string;
  email: string;
  normalizedEmail: string;
  passwordHash: string;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserRecord = Omit<UserDocument, "_id">;

export type SafeUser = {
  id: string;
  name: string;
  email: string;
};

export function toSafeUser(user: UserDocument): SafeUser {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
  };
}
