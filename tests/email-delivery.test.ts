import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import * as errors from "../src/infrastructure/email/delivery-error.ts";

test("provider failures produce actionable messages without reflecting provider data", () => {
  const cases: [number, unknown, errors.DeliveryFailure][] = [
    [403, { name: "validation_error", message: "You can only send testing emails to your own email address (private@example.com)." }, "TEST_RECIPIENT"],
    [403, { message: "The private.example domain is not verified." }, "SENDER_DOMAIN"],
    [401, { message: "API key is invalid" }, "AUTHENTICATION"],
    [403, { name: "restricted_api_key" }, "AUTHENTICATION"],
    [429, {}, "RATE_LIMIT"],
    [403, { name: "daily_quota_exceeded" }, "RATE_LIMIT"],
    [422, { message: "Invalid sender containing secret-token" }, "INVALID_REQUEST"],
    [500, { message: "Internal failure: secret-token" }, "PROVIDER"],
    [503, "not JSON", "PROVIDER"],
  ];
  for (const [status, body, expected] of cases) {
    const reason = errors.classifyResendFailure(status, body);
    assert.equal(reason, expected);
    const failure = new errors.EmailDeliveryError(reason);
    assert.doesNotMatch(failure.message, /private@example|private\.example|secret-token/);
  }
});

function sender(fetcher: typeof fetch, overrides: Record<string, unknown> = {}) {
  const env = { NODE_ENV: "test", RESEND_API_KEY: "re_test_fixture", EMAIL_FROM: "Make My Marriage <sender@example.test>", APP_BASE_URL: "http://localhost:3000", ...overrides };
  const compiled = ts.transpileModule(readFileSync(new URL("../src/infrastructure/email/family-invitation-email.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiledModule = { exports: {} };
  const dependencies: Record<string, unknown> = { "server-only": {}, "@/config/env": { env }, "./delivery-error": errors };
  new Function("require", "module", "exports", "fetch", compiled)((name: string) => { if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`); return dependencies[name]; }, compiledModule, compiledModule.exports, fetcher);
  return compiledModule.exports as typeof import("../src/infrastructure/email/family-invitation-email.ts");
}
const input = { email: "recipient@example.test", name: "Family", inviter: "Owner", wedding: "Our Wedding", token: "private-invite-token" };
test("email transport classifies Resend rejection and network/timeout errors", async () => {
  const rejected = sender(async () => Response.json({ name: "validation_error", message: "You can only send testing emails to your own email address recipient@example.test" }, { status: 403 }));
  await assert.rejects(() => rejected.sendFamilyInvitationEmail(input), error => error instanceof errors.EmailDeliveryError && error.reason === "TEST_RECIPIENT");
  const offline = sender(async () => { throw new TypeError("fetch failed: private-invite-token"); });
  await assert.rejects(() => offline.sendFamilyInvitationEmail(input), error => error instanceof errors.EmailDeliveryError && error.reason === "NETWORK" && !error.message.includes(input.token));
  const timedOut = sender(async () => { const error = new Error("timeout"); error.name = "TimeoutError"; throw error; });
  await assert.rejects(() => timedOut.sendFamilyInvitationEmail(input), error => error instanceof errors.EmailDeliveryError && error.reason === "TIMEOUT");
});
test("placeholder configuration fails before making an email request", async () => {
  let called = false;
  const unconfigured = sender(async () => { called = true; return Response.json({ id: "email-id" }); }, { RESEND_API_KEY: "re_your_api_key" });
  await assert.rejects(() => unconfigured.sendFamilyInvitationEmail(input), error => error instanceof errors.EmailDeliveryError && error.reason === "CONFIGURATION");
  assert.equal(called, false);
});
test("provider submission succeeds without exposing the private link in the return value", async () => {
  const configured = sender(async (_url, init) => { assert.equal(JSON.parse(init!.body as string).to[0], input.email); return Response.json({ id: "email-id" }); });
  assert.equal(await configured.sendFamilyInvitationEmail(input), undefined);
});
