"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { isValidISODate, localNow } from "@/lib/dates";

function refresh() {
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function createHabit(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!name) return;
  const pillar = String(formData.get("pillar") ?? "").trim().slice(0, 40);
  const timeHint = String(formData.get("timeHint") ?? "").trim().slice(0, 20);
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(schema.habits.sort) }).from(schema.habits);
  await db.insert(schema.habits).values({ name, pillar, timeHint, sort: (m ?? 0) + 1, createdAt: localNow() });
  refresh();
}

export async function toggleHabit(habitId: number, date: string, done: boolean) {
  if (!isValidISODate(date)) throw new Error("Fecha inválida");
  const db = await getDb();
  if (done) await db.insert(schema.habitLogs).values({ habitId, date }).onConflictDoNothing();
  else await db.delete(schema.habitLogs).where(and(eq(schema.habitLogs.habitId, habitId), eq(schema.habitLogs.date, date)));
  refresh();
}

export async function archiveHabit(habitId: number) {
  const db = await getDb();
  await db.update(schema.habits).set({ archived: true }).where(eq(schema.habits.id, habitId));
  refresh();
}
