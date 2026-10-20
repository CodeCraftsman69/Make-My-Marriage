import "server-only";
import { getWeddingMembersCollection } from "./mongo-wedding-member-repository.ts";
let promise: Promise<void> | undefined;
export function ensureWeddingMemberIndexes() {
  return promise ??= (async () => {
    const members = await getWeddingMembersCollection();
    await Promise.all([
      members.createIndex({ weddingId: 1, userId: 1 }, { unique: true, name: "wedding_members_wedding_user_unique" }),
      members.createIndex({ userId: 1, status: 1 }, { name: "wedding_members_user_status" }),
    ]);
  })().catch(error => { promise = undefined; throw error; });
}
