import assert from "node:assert/strict";
import test from "node:test";

import { generateSecureToken, hashToken } from "../src/shared/security/tokens.ts";

test("secure tokens are random and URL-safe", () => {
  const first = generateSecureToken();
  const second = generateSecureToken();

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.ok(first.length >= 43);
});

test("token hashes are deterministic and do not expose the raw token", () => {
  const token = "a-high-entropy-token";
  const hash = hashToken(token);

  assert.equal(hash, hashToken(token));
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f\d]{64}$/);
});

test("token generation rejects unsafe byte lengths", () => {
  assert.throws(() => generateSecureToken(8), RangeError);
});
