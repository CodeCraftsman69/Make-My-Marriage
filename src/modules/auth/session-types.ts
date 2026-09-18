import type { ObjectId } from "mongodb";

export type SessionDocument = {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
};

export type CreateSessionRecord = Omit<SessionDocument, "_id">;

export type IssuedSession = {
  token: string;
  expiresAt: Date;
};
