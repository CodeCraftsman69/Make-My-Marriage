import "server-only";

import type { Collection } from "mongodb";

import { getDatabase } from "@/infrastructure/db";

import type { SessionRepository } from "./session-repository.ts";
import type { CreateSessionRecord, SessionDocument } from "./session-types.ts";

export async function getSessionsCollection(): Promise<Collection<SessionDocument>> {
  return (await getDatabase()).collection<SessionDocument>("sessions");
}

export class MongoSessionRepository implements SessionRepository {
  async create(input: CreateSessionRecord): Promise<SessionDocument> {
    const collection = await getSessionsCollection();
    const result = await collection.insertOne(input as SessionDocument);
    return { ...input, _id: result.insertedId };
  }

  async findByTokenHash(tokenHash: string): Promise<SessionDocument | null> {
    return (await getSessionsCollection()).findOne({ tokenHash });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await (await getSessionsCollection()).deleteOne({ tokenHash });
  }
}
