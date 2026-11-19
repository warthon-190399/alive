"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { localNow, today } from "@/lib/dates";

export async function addPriority(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const area = String(formData.get("area") ?? "").trim().slice(0, 30);
  if (!title) return;
  const db = await getDb();
  await db.insert(schema.priorities).values({ date: today(), title, area, createdAt: localNow() });
  revalidatePath("/");
}

export async function setPriorityDone(id: number, done: boolean) {
  const db = await getDb();
  await db.update(schema.priorities).set({ done }).where(eq(schema.priorities.id, id));
  revalidatePath("/");
}

export async function deletePriority(id: number) {
  const db = await getDb();
  await db.delete(schema.priorities).where(eq(schema.priorities.id, id));
  revalidatePath("/");
}
