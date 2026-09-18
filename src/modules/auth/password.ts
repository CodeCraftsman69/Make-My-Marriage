import { hash, verify, type Algorithm } from "@node-rs/argon2";

const passwordHashOptions = {
  algorithm: 2 as Algorithm,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, passwordHashOptions);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
