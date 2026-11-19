import "server-only";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";

export function mediaUrl(p: string) {
  return `/media/${p}`;
}

/** id de media → URL servible */
export async function mediaMap(ids: number[]) {
  const map: Record<number, string> = {};
  if (!ids.length) return map;
  const db = await getDb();
  const rows = await db.select().from(schema.media).where(inArray(schema.media.id, ids));
  for (const r of rows) map[r.id] = mediaUrl(r.path);
  return map;
}
