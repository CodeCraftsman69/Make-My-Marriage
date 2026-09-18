import assert from "node:assert/strict";
import test from "node:test";

import {
  emailSchema,
  objectIdStringSchema,
  paginationQuerySchema,
} from "../src/shared/validation/primitives.ts";

test("email validation normalizes safe input", () => {
  assert.equal(emailSchema.parse("  FAMILY@Example.COM "), "family@example.com");
  assert.equal(emailSchema.safeParse("not-an-email").success, false);
});

test("ObjectId validation accepts only 24 hexadecimal characters", () => {
  assert.equal(objectIdStringSchema.safeParse("507f1f77bcf86cd799439011").success, true);
  assert.equal(objectIdStringSchema.safeParse("not-an-object-id").success, false);
});

test("pagination applies bounded defaults", () => {
  assert.deepEqual(paginationQuerySchema.parse({}), { limit: 30 });
  assert.deepEqual(paginationQuerySchema.parse({ limit: "50", cursor: "next" }), {
    limit: 50,
    cursor: "next",
  });
  assert.equal(paginationQuerySchema.safeParse({ limit: 101 }).success, false);
});
