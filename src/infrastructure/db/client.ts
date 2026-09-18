import "server-only";

import { MongoClient } from "mongodb";

import { getMongoConfig } from "@/config/env";

declare global {
  var __makeMyMarriageMongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const { uri } = getMongoConfig();
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  return client.connect().catch((error: unknown) => {
    globalThis.__makeMyMarriageMongoClientPromise = undefined;
    throw new Error("Unable to connect to MongoDB.", { cause: error });
  });
}

export function getMongoClient(): Promise<MongoClient> {
  globalThis.__makeMyMarriageMongoClientPromise ??= createClientPromise();
  return globalThis.__makeMyMarriageMongoClientPromise;
}
