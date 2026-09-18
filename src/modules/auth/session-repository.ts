import type { CreateSessionRecord, SessionDocument } from "./session-types.ts";

export interface SessionRepository {
  create(input: CreateSessionRecord): Promise<SessionDocument>;
  findByTokenHash(tokenHash: string): Promise<SessionDocument | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}
