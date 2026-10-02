import assert from "node:assert/strict";
import test from "node:test";
import { PasswordResetService, RESET_LIFETIME_MS, type ResetStore } from "../src/modules/auth/password-reset-service.ts";
import { hashToken } from "../src/shared/security/tokens.ts";
import { verifyPassword } from "../src/modules/auth/password.ts";

function fixture() {
  let time = new Date("2026-10-02T00:00:00Z");
  let record: { hash: string; expiry: Date; used: boolean } | null = null;
  let count = 0;
  let passwordHash = "old-hash";
  let sessions = 2;
  const mail: Array<{ email: string; token: string }> = [];
  const store: ResetStore = {
    async allowRequest() { return ++count <= 3; },
    async findActiveUser(email) { return email === "user@example.com" ? { id: "user", email } : null; },
    async save(_id, hash, _now, expiry) { record = { hash, expiry, used: false }; },
    async isValid(hash, now) { return Boolean(record && record.hash === hash && !record.used && record.expiry > now); },
    async consumeAndChangePassword(hash, newHash, now) {
      if (!record || record.hash !== hash || record.used || record.expiry <= now) return false;
      record.used = true; passwordHash = newHash; sessions = 0;
      return true;
    },
  };
  const service = new PasswordResetService(store, async (email, token) => { mail.push({ email, token }); }, () => time);
  return { service, mail, advance: (ms: number) => { time = new Date(time.getTime() + ms); }, record: () => record, password: () => passwordHash, sessions: () => sessions };
}

test("reset requests normalize email and persist only a short-lived token hash", async () => {
  const f = fixture();
  await f.service.request(" USER@EXAMPLE.COM ");
  assert.equal(f.mail.length, 1);
  assert.equal(f.mail[0].token.length, 43);
  assert.equal(f.record()?.hash, hashToken(f.mail[0].token));
  assert.notEqual(f.record()?.hash, f.mail[0].token);
  assert.equal(f.record()?.expiry.toISOString(), "2026-10-02T00:30:00.000Z");
});

test("unknown and throttled accounts complete without revealing account status", async () => {
  const unknown = fixture();
  assert.equal(await unknown.service.request("unknown@example.com"), undefined);
  assert.equal(unknown.mail.length, 0);
  const known = fixture();
  for (let i = 0; i < 5; i++) assert.equal(await known.service.request("user@example.com"), undefined);
  assert.equal(known.mail.length, 3);
});

test("successful reset hashes the password, consumes token and revokes sessions", async () => {
  const f = fixture(); await f.service.request("user@example.com");
  await f.service.reset(f.mail[0].token, "a-new-long-passphrase");
  assert.equal(await verifyPassword(f.password(), "a-new-long-passphrase"), true);
  assert.equal(f.sessions(), 0);
  assert.equal(f.record()?.used, true);
  await assert.rejects(f.service.reset(f.mail[0].token, "another-long-password"), /invalid or expired/);
});

test("expired and superseded reset links cannot change the password", async () => {
  const f = fixture(); await f.service.request("user@example.com");
  const oldToken = f.mail[0].token;
  await f.service.request("user@example.com");
  await assert.rejects(f.service.reset(oldToken, "a-new-long-passphrase"), /invalid or expired/);
  f.advance(RESET_LIFETIME_MS);
  await assert.rejects(f.service.reset(f.mail[1].token, "a-new-long-passphrase"), /invalid or expired/);
  assert.equal(f.password(), "old-hash"); assert.equal(f.sessions(), 2);
});

test("only one concurrent reset attempt can consume the same link", async () => {
  const f = fixture(); await f.service.request("user@example.com");
  const results = await Promise.allSettled([
    f.service.reset(f.mail[0].token, "first-long-passphrase"),
    f.service.reset(f.mail[0].token, "second-long-passphrase"),
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
});
