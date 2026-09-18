import "server-only";

import { getDatabase } from "./database";

export async function checkDatabaseHealth(): Promise<void> {
  const database = await getDatabase();
  await database.command({ ping: 1 });
}
