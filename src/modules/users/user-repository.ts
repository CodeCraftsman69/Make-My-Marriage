import type { CreateUserRecord, UserDocument } from "./user-types.ts";

export class DuplicateEmailError extends Error {
  constructor() {
    super("A user with this normalized email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export interface UserRepository {
  create(input: CreateUserRecord): Promise<UserDocument>;
  findById(id: UserDocument["_id"]): Promise<UserDocument | null>;
  findByNormalizedEmail(normalizedEmail: string): Promise<UserDocument | null>;
}
