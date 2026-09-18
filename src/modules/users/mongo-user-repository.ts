import "server-only";

import { MongoServerError, type Collection, type ObjectId } from "mongodb";

import { getDatabase } from "@/infrastructure/db";

import {
  DuplicateEmailError,
  type UserRepository,
} from "./user-repository.ts";
import type { CreateUserRecord, UserDocument } from "./user-types.ts";

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  return (await getDatabase()).collection<UserDocument>("users");
}

export class MongoUserRepository implements UserRepository {
  async create(input: CreateUserRecord): Promise<UserDocument> {
    const collection = await getUsersCollection();

    try {
      const result = await collection.insertOne(input as UserDocument);
      return { ...input, _id: result.insertedId };
    } catch (error: unknown) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  async findById(id: ObjectId): Promise<UserDocument | null> {
    return (await getUsersCollection()).findOne({ _id: id });
  }

  async findByNormalizedEmail(normalizedEmail: string): Promise<UserDocument | null> {
    return (await getUsersCollection()).findOne({ normalizedEmail });
  }
}
