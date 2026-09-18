import { ApplicationError } from "../../shared/http/application-error.ts";
import { generateSecureToken, hashToken } from "../../shared/security/tokens.ts";
import {
  DuplicateEmailError,
  toSafeUser,
  type SafeUser,
  type UserRepository,
} from "../users/index.ts";

import type { LoginInput, RegisterInput } from "./auth-schemas.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import type { SessionRepository } from "./session-repository.ts";
import { getSessionExpiry } from "./session-policy.ts";
import type { IssuedSession } from "./session-types.ts";

type AuthServiceDependencies = {
  users: UserRepository;
  sessions: SessionRepository;
  ensureIndexes: () => Promise<void>;
  now?: () => Date;
};

export type AuthResult = {
  user: SafeUser;
  session: IssuedSession;
};

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const DUMMY_PASSWORD = "invalid-password-placeholder";
let dummyPasswordHashPromise: Promise<string> | undefined;

function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHashPromise ??= hashPassword(DUMMY_PASSWORD);
  return dummyPasswordHashPromise;
}

export class AuthService {
  private readonly dependencies: AuthServiceDependencies;
  private readonly now: () => Date;

  constructor(dependencies: AuthServiceDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date());
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    await this.dependencies.ensureIndexes();

    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await this.dependencies.users.findByNormalizedEmail(normalizedEmail);

    if (existingUser) {
      throw new ApplicationError("EMAIL_ALREADY_EXISTS", "An account with this email already exists.");
    }

    const now = this.now();
    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.dependencies.users.create({
        name: input.name.trim(),
        email: normalizedEmail,
        normalizedEmail,
        passwordHash,
        status: "ACTIVE",
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      return {
        user: toSafeUser(user),
        session: await this.issueSession(user._id, now),
      };
    } catch (error: unknown) {
      if (error instanceof DuplicateEmailError) {
        throw new ApplicationError(
          "EMAIL_ALREADY_EXISTS",
          "An account with this email already exists.",
        );
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    await this.dependencies.ensureIndexes();

    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.dependencies.users.findByNormalizedEmail(normalizedEmail);
    const passwordHash = user?.passwordHash ?? (await getDummyPasswordHash());
    const passwordIsValid = await verifyPassword(passwordHash, input.password);

    if (!user || user.status !== "ACTIVE" || !passwordIsValid) {
      throw new ApplicationError("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
    }

    const now = this.now();
    return {
      user: toSafeUser(user),
      session: await this.issueSession(user._id, now),
    };
  }

  async resolveUser(token: string | undefined): Promise<SafeUser | null> {
    if (!token) {
      return null;
    }

    await this.dependencies.ensureIndexes();

    const tokenHash = hashToken(token);
    const session = await this.dependencies.sessions.findByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() <= this.now().getTime()) {
      await this.dependencies.sessions.deleteByTokenHash(tokenHash);
      return null;
    }

    const user = await this.dependencies.users.findById(session.userId);
    if (!user || user.status !== "ACTIVE") {
      await this.dependencies.sessions.deleteByTokenHash(tokenHash);
      return null;
    }

    return toSafeUser(user);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.dependencies.ensureIndexes();
    await this.dependencies.sessions.deleteByTokenHash(hashToken(token));
  }

  private async issueSession(userId: Parameters<UserRepository["findById"]>[0], now: Date) {
    const token = generateSecureToken();
    const expiresAt = getSessionExpiry(now);

    await this.dependencies.sessions.create({
      userId,
      tokenHash: hashToken(token),
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
    });

    return { token, expiresAt };
  }
}
