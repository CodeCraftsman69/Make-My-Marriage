import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { ObjectId } from "mongodb";
import ts from "typescript";
import { ApplicationError } from "../src/shared/http/application-error.ts";
import * as policy from "../src/modules/family/invitation-policy.ts";
import * as tokens from "../src/shared/security/tokens.ts";
import * as permissions from "../src/modules/family/permissions.ts";
import { EmailDeliveryError, type DeliveryFailure } from "../src/infrastructure/email/delivery-error.ts";

type Row = Record<string, unknown>;
const equal = (left: unknown, right: unknown): boolean => left instanceof ObjectId ? left.equals(right as ObjectId) : left instanceof Date ? right instanceof Date && left.getTime() === right.getTime() : left === right;
function matches(row: Row, query: Row) {
  return Object.entries(query).every(([key, value]) => {
    if (value && typeof value === "object" && !(value instanceof ObjectId) && !(value instanceof Date)) {
      const condition = value as Row;
      if ("$gt" in condition) return (row[key] as Date) > (condition.$gt as Date);
      if ("$in" in condition) return (condition.$in as unknown[]).some(item => equal(row[key], item));
    }
    return equal(row[key], value);
  });
}

// Exercise the real server use cases with isolated database/email adapters. No live accounts or mail.
function fixture() {
  const owner = { id: new ObjectId().toHexString(), name: "Owner", email: "owner@example.com" };
  const member = { id: new ObjectId().toHexString(), name: "Sister", email: "sister@example.com" };
  const weddingId = new ObjectId();
  let tables: Record<string, Row[]> = {
    weddings: [{ _id: weddingId, title: "Our Wedding", status: "ACTIVE", deletedAt: null }],
    users: [
      { _id: new ObjectId(owner.id), name: owner.name, email: owner.email, normalizedEmail: owner.email, status: "ACTIVE", passwordHash: "stored-owner-hash" },
      { _id: new ObjectId(member.id), name: member.name, email: member.email, normalizedEmail: member.email, status: "ACTIVE", passwordHash: "stored-member-hash" },
    ],
    weddingMembers: [{ _id: new ObjectId(), userId: new ObjectId(owner.id), weddingId, role: "OWNER", status: "ACTIVE", relationship: "BRIDE", joinedAt: new Date() }],
  };
  const collection = (name: string) => {
    const rows = () => tables[name] ??= [];
    function update(query: Row, change: { $set?: Row; $setOnInsert?: Row; $inc?: Record<string, number> }, upsert: boolean) {
      let row = rows().find(item => matches(item, query));
      if (!row && upsert) { row = { _id: new ObjectId(), ...query, ...change.$setOnInsert }; rows().push(row); }
      if (!row) return null;
      Object.assign(row, change.$set);
      for (const [key, amount] of Object.entries(change.$inc ?? {})) row[key] = Number(row[key] ?? 0) + amount;
      return { ...row };
    }
    return {
      createIndex: async () => "index",
      findOne: async (query: Row) => { const found = rows().find(row => matches(row, query)); return found ? { ...found } : null; },
      find: (query: Row) => { const cursor = { sort: () => cursor, toArray: async () => rows().filter(row => matches(row, query)).map(row => ({ ...row })) }; return cursor; },
      insertOne: async (row: Row) => { rows().push({ ...row }); return { insertedId: row._id }; },
      updateOne: async (query: Row, change: Parameters<typeof update>[1], options?: { upsert?: boolean }) => {
        if (name === "familyInvitations" && change.$set?.status === "ACCEPTED" && failConsumption) throw new Error("Injected consumption failure");
        if (name === "weddingMembers" && change.$set?.role === "OWNER" && failOwnerPromotion) throw new Error("Injected owner promotion failure");
        if (name === "familyInvitations" && change.$set?.deliveryStatus === "SENT" && failSentStatus) throw new Error("Injected status persistence failure");
        return { matchedCount: update(query, change, Boolean(options?.upsert)) ? 1 : 0 };
      },
      updateMany: async (query: Row, change: Parameters<typeof update>[1]) => {
        const selected = rows().filter(row => matches(row, query));
        for (const row of selected) update({ _id: row._id }, change, false);
        return { matchedCount: selected.length };
      },
      findOneAndUpdate: async (query: Row, change: Parameters<typeof update>[1], options?: { upsert?: boolean }) => update(query, change, Boolean(options?.upsert)),
    };
  };
  let transactionTail = Promise.resolve();
  const session = {
    withTransaction: async <T>(run: () => Promise<T>) => {
      const previous = transactionTail;
      let release!: () => void;
      transactionTail = new Promise<void>(resolve => { release = resolve; });
      await previous;
      const snapshot = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.map(row => ({ ...row }))]));
      try { return await run(); } catch (error) { tables = snapshot; throw error; } finally { release(); }
    }, endSession: async () => {},
  };
  const deliveries: { email: string; token: string; wedding: string }[] = [];
  let failEmail = false;
  let deliveryFailure: DeliveryFailure | undefined;
  let failSentStatus = false;
  let failConsumption = false;
  let failOwnerPromotion = false;
  const dependencies: Record<string, unknown> = {
    "server-only": {}, mongodb: { ObjectId },
    "@/infrastructure/db": { getDatabase: async () => ({ collection }), getMongoClient: async () => ({ startSession: () => session }) },
    "@/infrastructure/email/family-invitation-email": { assertFamilyEmailConfigured() {}, sendFamilyInvitationEmail: async (input: typeof deliveries[number]) => { if (failEmail) throw deliveryFailure ? new EmailDeliveryError(deliveryFailure) : new Error("Provider failed"); deliveries.push(input); } },
    "@/infrastructure/email/delivery-error": { EmailDeliveryError },
    "@/shared/http": { ApplicationError }, "@/shared/security/tokens": tokens,
    "@/modules/users/mongo-user-repository": { MongoUserRepository: class { async findById(userId: ObjectId) { return collection("users").findOne({ _id: userId }); } } },
    "./password": { verifyPassword: async (_hash: string, password: string) => password === "correct-password" },
    "./permissions": permissions,
    "./ensure-indexes": { ensureWeddingMemberIndexes: async () => {} }, "./invitation-policy": policy,
  };
  function loadServer(file: string) {
    const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const compiledModule = { exports: {} };
    new Function("require", "module", "exports", compiled)((name: string) => { if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`); return dependencies[name]; }, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  dependencies["./authorization"] = loadServer("../src/modules/family/authorization.ts");
  dependencies["@/modules/auth"] = loadServer("../src/modules/auth/confirm-password.server.ts");
  dependencies["./membership-access.server"] = loadServer("../src/modules/family/membership-access.server.ts");
  dependencies["@/modules/family/authorization"] = dependencies["./authorization"];
  dependencies["@/modules/family/ensure-indexes"] = dependencies["./ensure-indexes"];
  dependencies["@/modules/family/mongo-wedding-member-repository"] = { MongoWeddingMemberRepository: class {} };
  dependencies["./wedding-factory.ts"] = { buildWeddingWorkspace() { throw new Error("Creation is outside this fixture"); } };
  dependencies["./wedding-types.ts"] = loadServer("../src/modules/weddings/wedding-types.ts");
  dependencies["./mongo-wedding-repository.ts"] = { MongoWeddingRepository: class {
    async update(weddingId: ObjectId, patch: Row, session?: unknown) {
      assert.ok(session, "wedding updates must participate in the permission transaction");
      return collection("weddings").findOneAndUpdate({ _id: weddingId, deletedAt: null }, { $set: patch });
    }
  } };
  const weddingService = loadServer("../src/modules/weddings/wedding-service.server.ts") as typeof import("../src/modules/weddings/wedding-service.server.ts");
  const compiled = ts.transpileModule(readFileSync(new URL("../src/modules/family/family-service.server.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", compiled)((name: string) => { if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`); return dependencies[name]; }, compiledModule, compiledModule.exports);
  type Service = typeof import("../src/modules/family/family-service.server.ts");
  const service = compiledModule.exports as Service;
  const input = { name: member.name, email: member.email, relationship: "SISTER" as const, role: "VIEWER" as const };
  const accessService = dependencies["./membership-access.server"] as typeof import("../src/modules/family/membership-access.server.ts");
  const authorization = dependencies["./authorization"] as typeof import("../src/modules/family/authorization.ts");
  const confirmation = dependencies["@/modules/auth"] as typeof import("../src/modules/auth/confirm-password.server.ts");
  return { owner, member, weddingId: weddingId.toHexString(), service, accessService, authorization, confirmation, weddingService, input, deliveries, rows: (name: string) => tables[name] ?? [], failDelivery: (reason?: DeliveryFailure) => { failEmail = true; deliveryFailure = reason; }, failSentStatus: () => { failSentStatus = true; }, failConsumption: () => { failConsumption = true; }, failOwnerPromotion: () => { failOwnerPromotion = true; }, ageInvitation: () => { tables.familyInvitations[0].updatedAt = new Date(Date.now() - 61_000); } };
}

test("real invitation use case emails a private token but stores only its hash", async () => {
  const f = fixture();
  await f.service.sendFamilyInvite(f.owner, f.weddingId, f.input);
  const [delivery] = f.deliveries; const [record] = f.rows("familyInvitations");
  assert.equal(delivery.email, f.member.email);
  assert.equal(record.tokenHash, createHash("sha256").update(delivery.token).digest("hex"));
  assert.equal(JSON.stringify(record).includes(delivery.token), false);
  assert.equal(record.deliveryStatus, "SENT");
  await assert.rejects(() => f.service.sendFamilyInvite(f.owner, f.weddingId, f.input), /already exists/);
});
test("resend supersedes the old token; wrong email and revoked links cannot join", async () => {
  const f = fixture();
  await f.service.sendFamilyInvite(f.owner, f.weddingId, f.input);
  const old = f.deliveries[0].token;
  const inviteId = (f.rows("familyInvitations")[0]._id as ObjectId).toHexString();
  await assert.rejects(() => f.service.resendFamilyInvite(f.owner, f.weddingId, inviteId), /wait a minute/);
  f.ageInvitation();
  await f.service.resendFamilyInvite(f.owner, f.weddingId, inviteId);
  assert.equal(await f.service.previewFamilyInvite(old), null);
  const token = f.deliveries[1].token;
  await assert.rejects(() => f.service.acceptFamilyInvite({ ...f.member, email: "other@example.com" }, token), /email address/);
  await f.service.revokeFamilyInvite(f.owner, f.weddingId, inviteId);
  await assert.rejects(() => f.service.acceptFamilyInvite(f.member, token), /no longer available/);
  assert.equal(f.rows("weddingMembers").length, 1);
});
test("acceptance is repeat-safe, adds one membership, and removed members cannot reuse it", async () => {
  const f = fixture();
  await f.service.sendFamilyInvite(f.owner, f.weddingId, f.input);
  const token = f.deliveries[0].token;
  const results = await Promise.all([f.service.acceptFamilyInvite(f.member, token), f.service.acceptFamilyInvite(f.member, token)]);
  assert.equal(results[0].weddingId, f.weddingId);
  assert.equal(f.rows("weddingMembers").length, 2);
  const member = f.rows("weddingMembers").find(row => row.role === "VIEWER")!;
  assert.equal(member.status, "ACTIVE");
  assert.equal(await f.service.previewFamilyInvite(token), null);
  assert.equal(await f.service.previewFamilyInvite(token, f.owner), null);
  assert.equal((await f.service.previewFamilyInvite(token, f.member))?.wedding, "Our Wedding");
  const view = await f.service.getFamily(f.member, f.weddingId);
  assert.equal(view.invitations.length, 0);
  assert.ok(view.members.every(person => person.email === ""));
  await assert.rejects(() => f.service.sendFamilyInvite(f.member, f.weddingId, { ...f.input, email: "another@example.com" }), /role does not allow/);
  await assert.rejects(() => f.service.removeFamilyMember(f.member, f.weddingId, (member._id as ObjectId).toHexString()), /role does not allow/);
  const owner = f.rows("weddingMembers").find(row => row.role === "OWNER")!;
  await assert.rejects(() => f.service.removeFamilyMember(f.owner, f.weddingId, (owner._id as ObjectId).toHexString()), /cannot be removed/);
  await f.service.removeFamilyMember(f.owner, f.weddingId, (member._id as ObjectId).toHexString());
  assert.equal(await f.service.previewFamilyInvite(token, f.member), null);
  await assert.rejects(() => f.service.acceptFamilyInvite(f.member, token), /access was removed/);
  await assert.rejects(() => f.service.getFamily(f.member, f.weddingId), /not found/);
});
test("failed email delivery remains visible and does not create a membership", async () => {
  const f = fixture(); f.failDelivery();
  await assert.rejects(() => f.service.sendFamilyInvite(f.owner, f.weddingId, f.input), /confirm email delivery/);
  assert.equal(f.rows("familyInvitations")[0].deliveryStatus, "FAILED");
  assert.equal(f.rows("weddingMembers").length, 1);
});
test("safe provider failures survive the invitation HTTP adapter boundary", async () => {
  const f = fixture(); f.failDelivery("SENDER_DOMAIN");
  await assert.rejects(() => f.service.sendFamilyInvite(f.owner, f.weddingId, f.input), /Verify the domain in Resend/);
  const view = await f.service.getFamily(f.owner, f.weddingId);
  assert.match(view.invitations[0].deliveryError ?? "", /Verify the domain/);
});
test("a submitted email is not marked failed if delivery-status persistence fails", async () => {
  const f = fixture(); f.failSentStatus();
  const result = await f.service.sendFamilyInvite(f.owner, f.weddingId, f.input);
  assert.match(result.message, /email was submitted/);
  assert.equal(f.deliveries.length, 1);
  assert.notEqual(f.rows("familyInvitations")[0].deliveryStatus, "FAILED");
});
test("expired tokens and cross-wedding requests are rejected", async () => {
  const f = fixture();
  await f.service.sendFamilyInvite(f.owner, f.weddingId, f.input);
  const token = f.deliveries[0].token;
  f.rows("familyInvitations")[0].expiresAt = new Date(0);
  await assert.rejects(() => f.service.acceptFamilyInvite(f.member, token), /expired/);
  await assert.rejects(() => f.service.getFamily(f.owner, new ObjectId().toHexString()), /not found/);
});
test("acceptance rollback leaves no orphan membership if token consumption fails", async () => {
  const f = fixture();
  await f.service.sendFamilyInvite(f.owner, f.weddingId, f.input);
  f.failConsumption();
  await assert.rejects(() => f.service.acceptFamilyInvite(f.member, f.deliveries[0].token), /consumption failure/);
  assert.equal(f.rows("weddingMembers").length, 1);
  assert.equal(f.rows("familyInvitations")[0].status, "PENDING");
});
test("invitation sending is rate-limited per owner", async () => {
  const f = fixture();
  for (let i = 0; i < 20; i++) await f.service.sendFamilyInvite(f.owner, f.weddingId, { ...f.input, email: `family${i}@example.com` });
  await assert.rejects(() => f.service.sendFamilyInvite(f.owner, f.weddingId, { ...f.input, email: "excess@example.com" }), /try again in an hour/);
  assert.equal(f.deliveries.length, 20);
});

async function joinedFixture(relationship: "SISTER" | "BRIDE" = "SISTER") {
  const f = fixture();
  await f.service.sendFamilyInvite(f.owner, f.weddingId, { ...f.input, relationship });
  await f.service.acceptFamilyInvite(f.member, f.deliveries[0].token);
  const memberId = (f.rows("weddingMembers").find(row => equal(row.userId, new ObjectId(f.member.id)))!._id as ObjectId).toHexString();
  return { ...f, memberId };
}
test("a bride defaults to Viewer, cannot be removed, and needs explicit password-confirmed co-ownership", async () => {
  const f = await joinedFixture("BRIDE");
  await assert.rejects(() => f.authorization.withWeddingAccess(f.member.id, f.weddingId, "editWedding", async () => ({ saved: true })), /role does not allow/);
  await assert.rejects(() => f.service.removeFamilyMember(f.owner, f.weddingId, f.memberId), /cannot be removed/);
  await assert.rejects(() => f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "CO_OWNER" }), /current password/);
  await f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "CO_OWNER", currentPassword: "correct-password" });
  assert.equal((await f.authorization.requireWeddingMember(f.member.id, f.weddingId)).role, "CO_OWNER");
  assert.deepEqual(await f.authorization.withWeddingAccess(f.member.id, f.weddingId, "editWedding", async () => ({ saved: true })), { saved: true });
  assert.equal(f.rows("familyAccessAudit").length, 1);
});
test("co-owners cannot escalate or manage peers and role changes apply without logging out", async () => {
  const f = await joinedFixture();
  await f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "CO_OWNER", currentPassword: "correct-password" });
  const ownerId = (f.rows("weddingMembers").find(row => row.role === "OWNER")!._id as ObjectId).toHexString();
  await assert.rejects(() => f.accessService.changeMemberRole(f.member, f.weddingId, ownerId, { role: "VIEWER" }), /cannot change/);
  await assert.rejects(() => f.accessService.changeMemberRole(f.member, f.weddingId, f.memberId, { role: "CO_OWNER" }), /cannot change/);
  await f.service.sendFamilyInvite(f.member, f.weddingId, { ...f.input, email: "new@example.com" });
  await f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "PLANNER", currentPassword: "correct-password" });
  assert.equal(f.rows("familyInvitations").find(row => row.inviteeEmail === "new@example.com")?.status, "REVOKED");
  await assert.rejects(() => f.authorization.withWeddingAccess(f.member.id, f.weddingId, "editWedding", async () => true), /role does not allow/);
  await assert.rejects(() => f.service.sendFamilyInvite(f.member, f.weddingId, { ...f.input, email: "another@example.com" }), /role does not allow/);
});
test("ownership transfer is explicit, atomic, and makes the former owner a Planner", async () => {
  const f = await joinedFixture();
  await assert.rejects(() => f.accessService.transferWeddingOwnership(f.owner, f.weddingId, { memberId: f.memberId, currentPassword: "correct-password", confirmation: "TRANSFER_OWNERSHIP" }), /active co-owner/);
  await f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "CO_OWNER", currentPassword: "correct-password" });
  await assert.rejects(() => f.accessService.transferWeddingOwnership(f.owner, f.weddingId, { memberId: f.memberId, currentPassword: "incorrect", confirmation: "TRANSFER_OWNERSHIP" }), /password is incorrect/);
  await f.accessService.transferWeddingOwnership(f.owner, f.weddingId, { memberId: f.memberId, currentPassword: "correct-password", confirmation: "TRANSFER_OWNERSHIP" });
  assert.equal((await f.authorization.requireWeddingMember(f.member.id, f.weddingId)).role, "OWNER");
  assert.equal((await f.authorization.requireWeddingMember(f.owner.id, f.weddingId)).role, "PLANNER");
  assert.equal(f.rows("weddingMembers").filter(row => row.role === "OWNER").length, 1);
  await assert.rejects(() => f.accessService.transferWeddingOwnership(f.owner, f.weddingId, { memberId: f.memberId, currentPassword: "correct-password", confirmation: "TRANSFER_OWNERSHIP" }), /role does not allow/);
});
test("a failed transfer rolls back both memberships", async () => {
  const f = await joinedFixture();
  await f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "CO_OWNER", currentPassword: "correct-password" });
  f.failOwnerPromotion();
  await assert.rejects(() => f.accessService.transferWeddingOwnership(f.owner, f.weddingId, { memberId: f.memberId, currentPassword: "correct-password", confirmation: "TRANSFER_OWNERSHIP" }), /promotion failure/);
  assert.equal((await f.authorization.requireWeddingMember(f.owner.id, f.weddingId)).role, "OWNER");
  assert.equal((await f.authorization.requireWeddingMember(f.member.id, f.weddingId)).role, "CO_OWNER");
});
test("simultaneous transfer and demotion cannot create zero owners", async () => {
  const f = await joinedFixture();
  await f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "CO_OWNER", currentPassword: "correct-password" });
  const results = await Promise.allSettled([
    f.accessService.transferWeddingOwnership(f.owner, f.weddingId, { memberId: f.memberId, currentPassword: "correct-password", confirmation: "TRANSFER_OWNERSHIP" }),
    f.accessService.changeMemberRole(f.owner, f.weddingId, f.memberId, { role: "VIEWER", currentPassword: "correct-password" }),
  ]);
  assert.ok(results.some(result => result.status === "fulfilled"));
  assert.equal(f.rows("weddingMembers").filter(row => row.role === "OWNER" && row.status === "ACTIVE").length, 1);
});
test("ownership confirmation rejects missing/wrong passwords and throttles repeated attempts", async () => {
  const f = fixture();
  await assert.rejects(() => f.confirmation.confirmUserPassword(f.owner.id), /current password/);
  for (let i = 0; i < 5; i++) await assert.rejects(() => f.confirmation.confirmUserPassword(f.owner.id, "wrong-password"), /incorrect/);
  await assert.rejects(() => f.confirmation.confirmUserPassword(f.owner.id, "correct-password"), /15 minutes/);
  assert.equal(f.rows("familyAccessAudit").length, 0);
});
test("actual wedding-update use case denies Viewers and Planners, including legacy family roles", async () => {
  const f = await joinedFixture();
  const row = () => f.rows("weddingMembers").find(member => equal(member.userId, new ObjectId(f.member.id)))!;
  for (const role of ["VIEWER", "PLANNER", "FAMILY_MEMBER", "UNRECOGNIZED"]) {
    row().role = role;
    await assert.rejects(() => f.weddingService.updateWedding(f.member, f.weddingId, { title: "Forbidden change" }));
    assert.equal(f.rows("weddings")[0].title, "Our Wedding");
  }
  row().role = "CO_OWNER";
  Object.assign(f.rows("weddings")[0], { bride: { name: "Bride" }, groom: { name: "Groom" }, weddingDate: new Date("2027-02-01"), timezone: "Asia/Kolkata", location: { city: "", state: "" }, description: null });
  const saved = await f.weddingService.updateWedding(f.member, f.weddingId, { title: "Authorized change" });
  assert.equal(saved?.title, "Authorized change");
});
