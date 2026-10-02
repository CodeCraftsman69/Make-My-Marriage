import { generateSecureToken, hashToken } from "../../shared/security/tokens.ts";
import { ApplicationError } from "../../shared/http/application-error.ts";
import { hashPassword } from "./password.ts";

export const RESET_LIFETIME_MS = 30 * 60 * 1000;
export const RESET_REQUEST_MESSAGE = "If an account exists, a password reset email has been sent. Check your inbox and spam folder.";
export interface ResetStore {
  allowRequest(emailHash: string, now: Date): Promise<boolean>;
  findActiveUser(email: string): Promise<{ id: string; email: string } | null>;
  save(userId: string, tokenHash: string, now: Date, expiresAt: Date): Promise<void>;
  isValid(tokenHash: string, now: Date): Promise<boolean>;
  consumeAndChangePassword(tokenHash: string, passwordHash: string, now: Date): Promise<boolean>;
}

export class PasswordResetService {
  private readonly store: ResetStore;
  private readonly send: (email: string, token: string) => Promise<void>;
  private readonly now: () => Date;
  constructor(store: ResetStore, send: (email: string, token: string) => Promise<void>, now: () => Date = () => new Date()) {
    this.store = store; this.send = send; this.now = now;
  }

  async request(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const now = this.now();
    if (!(await this.store.allowRequest(hashToken(normalizedEmail), now))) return;
    const user = await this.store.findActiveUser(normalizedEmail);
    if (!user) return;
    const token = generateSecureToken();
    await this.store.save(user.id, hashToken(token), now, new Date(now.getTime() + RESET_LIFETIME_MS));
    await this.send(user.email, token);
  }

  async reset(token: string, password: string): Promise<void> {
    const tokenHash = hashToken(token);
    const invalid = () => new ApplicationError("VALIDATION_ERROR", "This reset link is invalid or expired. Please request a new one.");
    if (!(await this.store.isValid(tokenHash, this.now()))) throw invalid();
    const passwordHash = await hashPassword(password);
    // Recheck expiry and consume atomically after hashing, including concurrent submissions.
    if (!(await this.store.consumeAndChangePassword(tokenHash, passwordHash, this.now()))) throw invalid();
  }
}
