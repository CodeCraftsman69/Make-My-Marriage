import assert from "node:assert/strict";
import test from "node:test";

import { ObjectId } from "mongodb";

import { AuthService } from "../src/modules/auth/auth-service.ts";
import {
  expiredSessionCookieOptions,
  sessionCookieName,
  sessionCookieOptions,
} from "../src/modules/auth/cookie-policy.ts";
import { requireAuthenticatedUser } from "../src/modules/auth/authentication.ts";
import type { SessionRepository } from "../src/modules/auth/session-repository.ts";
import type {
  CreateSessionRecord,
  SessionDocument,
} from "../src/modules/auth/session-types.ts";
import { verifyPassword } from "../src/modules/auth/password.ts";
import { ApplicationError } from "../src/shared/http/application-error.ts";
import { hashToken } from "../src/shared/security/tokens.ts";
import {
  DuplicateEmailError,
  type UserRepository,
} from "../src/modules/users/user-repository.ts";
import type {
  CreateUserRecord,
  UserDocument,
} from "../src/modules/users/user-types.ts";

class InMemoryUsers implements UserRepository {
  readonly records: UserDocument[] = [];

  async create(input: CreateUserRecord): Promise<UserDocument> {
    if (this.records.some((user) => user.normalizedEmail === input.normalizedEmail)) {
      throw new DuplicateEmailError();
    }
    const user = { ...input, _id: new ObjectId() };
    this.records.push(user);
    return user;
  }

  async findById(id: ObjectId): Promise<UserDocument | null> {
    return this.records.find((user) => user._id.equals(id)) ?? null;
  }

  async findByNormalizedEmail(normalizedEmail: string): Promise<UserDocument | null> {
    return this.records.find((user) => user.normalizedEmail === normalizedEmail) ?? null;
  }
}

class InMemorySessions implements SessionRepository {
  readonly records: SessionDocument[] = [];
  readonly lookupHashes: string[] = [];

  async create(input: CreateSessionRecord): Promise<SessionDocument> {
    const session = { ...input, _id: new ObjectId() };
    this.records.push(session);
    return session;
  }

  async findByTokenHash(tokenHash: string): Promise<SessionDocument | null> {
    this.lookupHashes.push(tokenHash);
    return this.records.find((session) => session.tokenHash === tokenHash) ?? null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const index = this.records.findIndex((session) => session.tokenHash === tokenHash);
    if (index >= 0) this.records.splice(index, 1);
  }
}

function createHarness(now = new Date("2027-01-01T00:00:00.000Z")) {
  const users = new InMemoryUsers();
  const sessions = new InMemorySessions();
  const service = new AuthService({
    users,
    sessions,
    ensureIndexes: async () => undefined,
    now: () => now,
  });
  return { users, sessions, service };
}

const registration = {
  name: "Priya",
  email: "priya@example.com",
  password: "a secure wedding password",
};

async function captureApplicationError(operation: () => Promise<unknown>) {
  try {
    await operation();
    assert.fail("Expected an ApplicationError.");
  } catch (error: unknown) {
    assert.ok(error instanceof ApplicationError);
    return error;
  }
}

test("registration normalizes email, hashes password, and creates a hashed session", async () => {
  const { service, users, sessions } = createHarness();
  const result = await service.register({ ...registration, email: "  PRIYA@Example.COM  " });

  assert.equal(result.user.email, "priya@example.com");
  assert.equal(users.records[0].normalizedEmail, "priya@example.com");
  assert.notEqual(users.records[0].passwordHash, registration.password);
  assert.equal(await verifyPassword(users.records[0].passwordHash, registration.password), true);
  assert.equal("passwordHash" in result.user, false);
  assert.equal(sessions.records.length, 1);
  assert.equal(sessions.records[0].tokenHash, hashToken(result.session.token));
  assert.equal("token" in sessions.records[0], false);
});

test("registration rejects an existing email and the unique-index race", async () => {
  const { service, users } = createHarness();
  await service.register(registration);

  const duplicate = await captureApplicationError(() => service.register(registration));
  assert.equal(duplicate.code, "EMAIL_ALREADY_EXISTS");

  const racingUsers = new InMemoryUsers();
  racingUsers.findByNormalizedEmail = async () => null;
  await racingUsers.create({ ...users.records[0], _id: undefined } as unknown as CreateUserRecord);
  const raceService = new AuthService({
    users: racingUsers,
    sessions: new InMemorySessions(),
    ensureIndexes: async () => undefined,
  });
  const race = await captureApplicationError(() => raceService.register(registration));
  assert.equal(race.code, "EMAIL_ALREADY_EXISTS");
});

test("login succeeds with correct credentials", async () => {
  const { service, sessions } = createHarness();
  await service.register(registration);
  const before = sessions.records.length;

  const result = await service.login({ email: registration.email, password: registration.password });
  assert.equal(result.user.email, registration.email);
  assert.equal(sessions.records.length, before + 1);
});

test("wrong password and unknown email expose identical errors", async () => {
  const { service } = createHarness();
  await service.register(registration);

  const wrongPassword = await captureApplicationError(() =>
    service.login({ email: registration.email, password: "the wrong password" }),
  );
  const unknownEmail = await captureApplicationError(() =>
    service.login({ email: "unknown@example.com", password: "the wrong password" }),
  );

  assert.equal(wrongPassword.code, "INVALID_CREDENTIALS");
  assert.equal(unknownEmail.code, wrongPassword.code);
  assert.equal(unknownEmail.message, wrongPassword.message);
});

test("disabled users cannot authenticate", async () => {
  const { service, users } = createHarness();
  await service.register(registration);
  users.records[0].status = "DISABLED";

  const error = await captureApplicationError(() =>
    service.login({ email: registration.email, password: registration.password }),
  );
  assert.equal(error.code, "INVALID_CREDENTIALS");
});

test("valid sessions resolve by token hash and never raw token", async () => {
  const { service, sessions } = createHarness();
  const registered = await service.register(registration);

  const user = await service.resolveUser(registered.session.token);
  assert.equal(user?.email, registration.email);
  assert.equal(sessions.lookupHashes.at(-1), hashToken(registered.session.token));
  assert.notEqual(sessions.lookupHashes.at(-1), registered.session.token);
});

test("invalid and expired sessions fail, and expired records are removed", async () => {
  const now = new Date("2027-01-10T00:00:00.000Z");
  const { service, users, sessions } = createHarness(now);
  const registered = await service.register(registration);
  const userId = users.records[0]._id;
  const expiredToken = "expired-high-entropy-token";
  await sessions.create({
    userId,
    tokenHash: hashToken(expiredToken),
    createdAt: new Date("2027-01-01T00:00:00.000Z"),
    lastUsedAt: new Date("2027-01-01T00:00:00.000Z"),
    expiresAt: new Date("2027-01-02T00:00:00.000Z"),
  });

  assert.equal(await service.resolveUser("not-a-session"), null);
  assert.equal(await service.resolveUser(expiredToken), null);
  assert.equal(sessions.records.some((item) => item.tokenHash === hashToken(expiredToken)), false);
  assert.ok(await service.resolveUser(registered.session.token));
});

test("logout invalidates a session and is safe to repeat", async () => {
  const { service } = createHarness();
  const registered = await service.register(registration);

  await service.logout(registered.session.token);
  await service.logout(registered.session.token);
  await service.logout(undefined);

  assert.equal(await service.resolveUser(registered.session.token), null);
});

test("the protected helper accepts valid sessions and rejects missing ones", async () => {
  const { service } = createHarness();
  const registered = await service.register(registration);

  assert.equal(
    (await requireAuthenticatedUser(registered.session.token, service)).email,
    registration.email,
  );
  const error = await captureApplicationError(() =>
    requireAuthenticatedUser(undefined, service),
  );
  assert.equal(error.code, "UNAUTHENTICATED");
});

test("cookie policy is HttpOnly, host-prefixed in production, and clearable", () => {
  const expiresAt = new Date("2027-01-08T00:00:00.000Z");
  assert.equal(sessionCookieName("production"), "__Host-mmm_session");
  assert.equal(sessionCookieName("development"), "mmm_session");
  assert.deepEqual(sessionCookieOptions("production", expiresAt), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
    expires: expiresAt,
    priority: "high",
  });
  assert.equal(expiredSessionCookieOptions("production").maxAge, 0);
});
