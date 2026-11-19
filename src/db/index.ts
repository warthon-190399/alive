import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

export const DATA_DIR = path.join(process.cwd(), "data");
export const MEDIA_DIR = path.join(DATA_DIR, "media");

type Db = LibSQLDatabase<typeof schema>;
type Holder = { db: Db; client: Client; ready?: Promise<void> };
const g = globalThis as unknown as { __aliveDb?: Holder };

function init(): Holder {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const client = createClient({ url: "file:data/alive.db" });
  const db = drizzle(client, { schema });
  return { db, client };
}

const holder: Holder = (g.__aliveDb ??= init());

/** Devuelve la base lista: aplica migraciones pendientes la primera vez. */
export async function getDb(): Promise<Db> {
  holder.ready ??= (async () => {
    await holder.client.execute("PRAGMA foreign_keys = ON");
    await holder.client.execute("PRAGMA journal_mode = WAL");
    await migrate(holder.db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  })();
  await holder.ready;
  return holder.db;
}

export { schema };
