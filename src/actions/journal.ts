"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import type { Block } from "@/db/schema";
import { isValidISODate, localNow } from "@/lib/dates";
import { saveImage, saveImageFromUrl } from "@/lib/media";
import { failure, type Result } from "@/lib/result";

function assertDate(date: string) {
  if (!isValidISODate(date)) throw new Error("Fecha inválida");
}

function cleanBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) return [];
  const out: Block[] = [];
  for (const b of input.slice(0, 200)) {
    if (!b || typeof b !== "object") continue;
    const id = String((b as Block).id ?? crypto.randomUUID()).slice(0, 64);
    if (b.type === "text") out.push({ id, type: "text", text: String(b.text ?? "").slice(0, 50000) });
    else if (b.type === "quote") out.push({ id, type: "quote", text: String(b.text ?? "").slice(0, 5000), source: String(b.source ?? "").slice(0, 300) });
    else if (b.type === "image" && Number.isInteger(b.mediaId)) out.push({ id, type: "image", mediaId: b.mediaId, caption: String(b.caption ?? "").slice(0, 500) });
  }
  return out;
}

export async function saveEntry(date: string, data: { title: string; blocks: Block[]; moods: string[]; location: string }) {
  assertDate(date);
  const db = await getDb();
  const values = {
    date,
    title: String(data.title ?? "").slice(0, 300),
    blocks: cleanBlocks(data.blocks),
    moods: Array.isArray(data.moods) ? data.moods.map(String).slice(0, 10) : [],
    location: String(data.location ?? "").slice(0, 120),
    updatedAt: localNow(),
  };
  await db
    .insert(schema.journalEntries)
    .values(values)
    .onConflictDoUpdate({ target: schema.journalEntries.date, set: values });
  revalidatePath("/journal", "layout");
  revalidatePath("/");
  return { savedAt: Date.now() };
}

export async function uploadImage(formData: FormData): Promise<Result<{ id: number; url: string }>> {
  try {
    const date = String(formData.get("date"));
    assertDate(date);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("No llegó ninguna imagen");
    const bytes = new Uint8Array(await file.arrayBuffer());
    return { ok: true, ...(await saveImage(bytes, file.type, date, "upload")) };
  } catch (e) {
    return failure(e);
  }
}

export async function importImage(url: string, date: string): Promise<Result<{ id: number; url: string }>> {
  try {
    assertDate(date);
    return { ok: true, ...(await saveImageFromUrl(url.trim(), date)) };
  } catch (e) {
    return failure(e);
  }
}

const IMG_URL = /^https?:\/\/\S+\.(jpe?g|png|webp|gif|avif)(\?\S*)?$/i;

export async function addFragment(date: string, kind: "nota" | "gratitud" | "recuerdo" | "web", text: string) {
  assertDate(date);
  const t = String(text ?? "").trim().slice(0, 5000);
  if (!t) return { ok: false as const, error: "Escribe algo primero" };
  const db = await getDb();
  if (kind === "web" || IMG_URL.test(t)) {
    try {
      const img = await saveImageFromUrl(t, date);
      await db.insert(schema.fragments).values({ date, kind: "web", text: "", mediaId: img.id, url: t, createdAt: localNow() });
    } catch (e) {
      if (kind === "web") return { ok: false as const, error: failure(e).error };
      await db.insert(schema.fragments).values({ date, kind, text: t, createdAt: localNow() });
    }
  } else {
    await db.insert(schema.fragments).values({ date, kind, text: t, createdAt: localNow() });
  }
  revalidatePath("/journal", "layout");
  return { ok: true as const };
}

export async function deleteFragment(id: number) {
  const db = await getDb();
  await db.delete(schema.fragments).where(eq(schema.fragments.id, id));
  revalidatePath("/journal", "layout");
}

export async function saveReview(period: string, answers: Record<string, string>) {
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error("Periodo inválido");
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(answers ?? {}).slice(0, 20)) clean[k.slice(0, 40)] = String(v).slice(0, 10000);
  const db = await getDb();
  const values = { period, answers: clean, updatedAt: localNow() };
  await db.insert(schema.reviews).values(values).onConflictDoUpdate({ target: schema.reviews.period, set: values });
  revalidatePath("/journal", "layout");
  return { savedAt: Date.now() };
}
