import "server-only";

import { MongoUserRepository } from "@/modules/users/mongo-user-repository";

import { AuthService } from "./auth-service.ts";
import { ensureAuthIndexes } from "./ensure-auth-indexes.ts";
import { MongoSessionRepository } from "./mongo-session-repository.ts";

export const authService = new AuthService({
  users: new MongoUserRepository(),
  sessions: new MongoSessionRepository(),
  ensureIndexes: ensureAuthIndexes,
});
