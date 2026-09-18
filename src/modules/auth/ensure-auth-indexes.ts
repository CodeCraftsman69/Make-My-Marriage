import "server-only";

import { getSessionsCollection } from "./mongo-session-repository.ts";
import { getUsersCollection } from "@/modules/users/mongo-user-repository";

let indexPromise: Promise<void> | undefined;

async function createAuthIndexes(): Promise<void> {
  const [users, sessions] = await Promise.all([
    getUsersCollection(),
    getSessionsCollection(),
  ]);

  await Promise.all([
    users.createIndex({ normalizedEmail: 1 }, { unique: true, name: "users_normalized_email_unique" }),
    sessions.createIndex({ tokenHash: 1 }, { unique: true, name: "sessions_token_hash_unique" }),
    sessions.createIndex({ userId: 1 }, { name: "sessions_user_id" }),
    sessions.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "sessions_expires_at_ttl" },
    ),
  ]);
}

export function ensureAuthIndexes(): Promise<void> {
  indexPromise ??= createAuthIndexes().catch((error: unknown) => {
    indexPromise = undefined;
    throw error;
  });

  return indexPromise;
}
