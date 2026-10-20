// Only invitation paths may override the default destination.
export function authReturnPath(value: unknown) {
  return typeof value === "string" && /^\/join\/[A-Za-z0-9_-]{43}$/.test(value) ? value : "/app/dashboard";
}
