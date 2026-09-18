import "server-only";

import type { Db } from "mongodb";

import { getMongoConfig } from "@/config/env";

import { getMongoClient } from "./client";

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getMongoConfig().databaseName);
}
