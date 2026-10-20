import test from "node:test";
import assert from "node:assert/strict";
import { assertInvitationAcceptable, invitationInputSchema, invitationTokenSchema, requireFamilyOwner } from "../src/modules/family/invitation-policy.ts";
import { authReturnPath } from "../src/modules/auth/auth-return-path.ts";
import { canChangeMemberRole, canRemoveMember, normalizeWeddingRole, permissionsForRole } from "../src/modules/family/permissions.ts";

test("family access management rejects members and unknown roles", () => {
  assert.doesNotThrow(() => requireFamilyOwner("OWNER"));
  assert.doesNotThrow(() => requireFamilyOwner("CO_OWNER"));
  for (const role of ["FAMILY_MEMBER", "PLANNER", "VIEWER", "ADMIN", "", "owner"]) assert.throws(() => requireFamilyOwner(role), /role does not allow/);
});
test("invitation input rejects ownership and role escalation", () => {
  const input = { name: "Ananya", email: "ANANYA@example.com", relationship: "SISTER" };
  assert.equal(invitationInputSchema.parse(input).email, "ananya@example.com");
  assert.equal(invitationInputSchema.parse(input).role, "VIEWER");
  for (const extra of [{ role: "OWNER" }, { role: "CO_OWNER" }, { weddingId: "another-wedding" }, { invitedBy: "attacker" }]) assert.equal(invitationInputSchema.safeParse({ ...input, ...extra }).success, false);
});
test("acceptance requires intended email and a live pending token", () => {
  const now = new Date("2026-10-18T12:00:00Z");
  const user = { id: "user", email: "Ananya@example.com" };
  const invite = { status: "PENDING", expiresAt: new Date(now.getTime() + 1000), inviteeEmail: "ananya@example.com" };
  assert.equal(assertInvitationAcceptable(invite, user, now), "ACCEPT");
  assert.throws(() => assertInvitationAcceptable(invite, { ...user, email: "other@example.com" }, now), /email address/);
  assert.throws(() => assertInvitationAcceptable({ ...invite, expiresAt: now }, user, now), /expired/);
  for (const status of ["REVOKED", "EXPIRED", "ACCEPTED"]) assert.throws(() => assertInvitationAcceptable({ ...invite, status }, user, now));
  assert.equal(assertInvitationAcceptable({ ...invite, status: "ACCEPTED", acceptedBy: user.id }, user, now), "ALREADY_ACCEPTED");
  assert.throws(() => assertInvitationAcceptable({ ...invite, status: "ACCEPTED", acceptedBy: "other" }, user, now));
});
test("authentication preserves only strict invitation return paths", () => {
  const token = "a".repeat(43);
  assert.equal(invitationTokenSchema.safeParse(token).success, true);
  assert.equal(authReturnPath(`/join/${token}`), `/join/${token}`);
  for (const path of ["https://evil.example", "//evil.example", "/join/short", `/join/${token}?next=//evil`, ["/join/token"], undefined]) assert.equal(authReturnPath(path), "/app/dashboard");
});
test("role permissions fail closed and separate planning from core wedding editing", () => {
  assert.equal(normalizeWeddingRole("FAMILY_MEMBER"), "VIEWER");
  assert.equal(permissionsForRole("FAMILY_MEMBER").editWedding, false);
  for (const role of [null, "ADMIN", "owner", "", undefined]) assert.ok(Object.values(permissionsForRole(role)).every(value => !value));
  for (const role of ["OWNER", "CO_OWNER"]) assert.equal(permissionsForRole(role).editWedding, true);
  assert.equal(permissionsForRole("PLANNER").editPlanning, true);
  assert.equal(permissionsForRole("PLANNER").editWedding, false);
  assert.equal(permissionsForRole("VIEWER").editPlanning, false);
  assert.equal(permissionsForRole("CO_OWNER").manageOwnership, false);
});
test("protected relationships and owner roles cannot be removed or self-escalated", () => {
  for (const actor of ["OWNER", "CO_OWNER", "PLANNER", "VIEWER"]) {
    for (const relationship of ["BRIDE", "GROOM"]) assert.equal(canRemoveMember(actor, "VIEWER", relationship, false), false);
    for (const target of ["OWNER", "CO_OWNER"]) assert.equal(canRemoveMember(actor, target, "OTHER", false), false);
    assert.equal(canChangeMemberRole(actor, "VIEWER", "OWNER", false), false);
    assert.equal(canChangeMemberRole(actor, "VIEWER", "CO_OWNER", true), false);
  }
  assert.equal(canChangeMemberRole("CO_OWNER", "VIEWER", "CO_OWNER", false), false);
  assert.equal(canChangeMemberRole("CO_OWNER", "CO_OWNER", "VIEWER", false), false);
  assert.equal(canChangeMemberRole("OWNER", "VIEWER", "CO_OWNER", false), true);
  assert.equal(canRemoveMember("OWNER", "PLANNER", "OTHER", false), true);
});
