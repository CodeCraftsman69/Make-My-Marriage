import assert from "node:assert/strict";
import test from "node:test";

import { z } from "zod";

import { ApplicationError } from "../src/shared/http/application-error.ts";
import { handleApiError, successResponse } from "../src/shared/http/response.ts";

test("success responses use the standard data envelope", async () => {
  const response = successResponse({ status: "ok" });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { status: "ok" } });
});

test("known application errors map to stable HTTP responses", async () => {
  const response = handleApiError(new ApplicationError("NOT_FOUND", "Resource not found."));

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: { code: "NOT_FOUND", message: "Resource not found." },
  });
});

test("Zod errors use the validation error envelope", async () => {
  const result = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
  assert.equal(result.success, false);

  if (result.success) {
    assert.fail("Expected validation to fail.");
  }

  const response = handleApiError(result.error);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "VALIDATION_ERROR");
  assert.ok(body.error.fields.name);
});

test("unexpected errors do not leak internal messages", async () => {
  const response = handleApiError(new Error("database credentials leaked here"));

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  });
});
