import { ApplicationError } from "../../shared/http/application-error.ts";

export const weddingRoles = ["OWNER", "CO_OWNER", "PLANNER", "VIEWER"] as const;
export type WeddingRole = typeof weddingRoles[number];
export function normalizeWeddingRole(value: unknown): WeddingRole | null {
  // Legacy members retain read access, but do not silently inherit write privileges.
  if (value === "FAMILY_MEMBER") return "VIEWER";
  return weddingRoles.includes(value as WeddingRole) ? value as WeddingRole : null;
}
export function permissionsForRole(value: unknown) {
  const role = normalizeWeddingRole(value);
  return {
    read: role !== null,
    editWedding: role === "OWNER" || role === "CO_OWNER",
    editPlanning: role === "OWNER" || role === "CO_OWNER" || role === "PLANNER",
    manageFamily: role === "OWNER" || role === "CO_OWNER",
    manageOwnership: role === "OWNER",
  };
}
export type WeddingPermission = keyof ReturnType<typeof permissionsForRole>;
export function requireWeddingPermission(role: unknown, permission: WeddingPermission) {
  if (!permissionsForRole(role)[permission]) throw new ApplicationError("FORBIDDEN", "Your wedding role does not allow this action.");
}
export function canChangeMemberRole(actorRole: unknown, targetRole: unknown, nextRole: unknown, self: boolean) {
  const actor = normalizeWeddingRole(actorRole), target = normalizeWeddingRole(targetRole), next = normalizeWeddingRole(nextRole);
  if (self || !actor || !target || !next || target === "OWNER" || next === "OWNER") return false;
  if (actor === "OWNER") return true;
  return actor === "CO_OWNER" && target !== "CO_OWNER" && next !== "CO_OWNER";
}
export function canRemoveMember(actorRole: unknown, targetRole: unknown, relationship: string, self: boolean) {
  const target = normalizeWeddingRole(targetRole);
  return !self && permissionsForRole(actorRole).manageFamily && target !== null && target !== "OWNER" && target !== "CO_OWNER" && relationship !== "BRIDE" && relationship !== "GROOM";
}
