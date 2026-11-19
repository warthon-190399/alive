"use server";

import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { INTEREST_STAGES, QUEUE_KINDS, QUEUE_STATUSES } from "@/db/schema";
import { localNow, today } from "@/lib/dates";

const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const optId = (v: unknown) => Number(v) || null;
function refresh() {
  revalidatePath("/knowledge", "layout");
}

/* Territorios */
export async function createInterest(formData: FormData) {
  const name = str(formData.get("name"), 80);
  if (!name) return;
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(schema.interests.sort) }).from(schema.interests);
  await db.insert(schema.interests).values({ name, question: str(formData.get("question"), 300), sort: (m ?? 0) + 1, createdAt: localNow() });
  refresh();
}

export async function updateInterest(id: number, patch: { name?: string; question?: string; stage?: (typeof INTEREST_STAGES)[number]; tags?: string[]; coverMediaId?: number | null }) {
  const db = await getDb();
  const set: Partial<typeof schema.interests.$inferInsert> = {};
  if (patch.name !== undefined && str(patch.name, 80)) set.name = str(patch.name, 80);
  if (patch.question !== undefined) set.question = str(patch.question, 300);
  if (patch.stage && INTEREST_STAGES.includes(patch.stage)) {
    set.stage = patch.stage;
    set.stageChangedAt = today();
  }
  if (patch.coverMediaId !== undefined) set.coverMediaId = patch.coverMediaId;
  if (patch.tags) set.tags = patch.tags.map((t) => str(t, 30)).filter(Boolean).slice(0, 8);
  if (Object.keys(set).length) await db.update(schema.interests).set(set).where(eq(schema.interests.id, id));
  refresh();
}

export async function archiveInterest(id: number) {
  const db = await getDb();
  await db.update(schema.interests).set({ archived: true }).where(eq(schema.interests.id, id));
  refresh();
}

/* Preguntas */
export async function createQuestion(formData: FormData) {
  const text = str(formData.get("text"), 300);
  if (!text) return;
  const db = await getDb();
  await db.insert(schema.questions).values({ text, interestId: optId(formData.get("interestId")), createdAt: localNow() });
  refresh();
}

export async function closeQuestion(id: number, conclusion: string) {
  const db = await getDb();
  await db.update(schema.questions).set({ status: "cerrada", conclusion: str(conclusion, 1000), closedAt: today() }).where(eq(schema.questions.id, id));
  refresh();
}

export async function reopenQuestion(id: number) {
  const db = await getDb();
  await db.update(schema.questions).set({ status: "abierta", closedAt: null }).where(eq(schema.questions.id, id));
  refresh();
}

export async function deleteQuestion(id: number) {
  const db = await getDb();
  await db.delete(schema.questions).where(eq(schema.questions.id, id));
  refresh();
}

/* Cola de exploración */
export async function createQueueItem(data: { title: string; author: string; kind: string; url: string; interestId: number | null; coverMediaId: number | null }) {
  const title = str(data.title, 200);
  if (!title) return;
  const db = await getDb();
  await db.insert(schema.queueItems).values({
    title,
    author: str(data.author, 120),
    kind: (QUEUE_KINDS as readonly string[]).includes(data.kind) ? (data.kind as (typeof QUEUE_KINDS)[number]) : "libro",
    url: str(data.url, 500) || null,
    interestId: data.interestId,
    coverMediaId: data.coverMediaId,
    createdAt: localNow(),
  });
  refresh();
}

/**
 * Cambia el estado. Un libro que pasa a "terminado" queda registrado también
 * en Experiences (una sola vez), con la misma portada.
 */
export async function setQueueStatus(id: number, status: (typeof QUEUE_STATUSES)[number]) {
  if (!QUEUE_STATUSES.includes(status)) return { experienceId: null };
  const db = await getDb();
  const [item] = await db.select().from(schema.queueItems).where(eq(schema.queueItems.id, id));
  if (!item) return { experienceId: null };
  let experienceId = item.experienceId;
  if (status === "terminado" && item.kind === "libro" && !experienceId) {
    const [exp] = await db
      .insert(schema.experiences)
      .values({ kind: "libro", title: item.title, date: today(), note: item.author ? `De ${item.author}.` : "", coverMediaId: item.coverMediaId, createdAt: localNow() })
      .returning({ id: schema.experiences.id });
    experienceId = exp.id;
    revalidatePath("/experiences");
  }
  await db
    .update(schema.queueItems)
    .set({ status, experienceId, finishedAt: status === "terminado" ? today() : null })
    .where(eq(schema.queueItems.id, id));
  refresh();
  return { experienceId: status === "terminado" ? experienceId : null };
}

export async function deleteQueueItem(id: number) {
  const db = await getDb();
  await db.delete(schema.queueItems).where(eq(schema.queueItems.id, id));
  refresh();
}

/* Chispas */
export async function createSpark(kind: "idea" | "enlace" | "video", text: string, interestId: number | null) {
  const t = str(text, 1000);
  if (!t) return;
  const url = /^https?:\/\/\S+$/.test(t) ? t : (t.match(/https?:\/\/\S+/)?.[0] ?? null);
  const db = await getDb();
  await db.insert(schema.sparks).values({ kind, text: t, url, interestId, createdAt: localNow() });
  refresh();
}

export async function deleteSpark(id: number) {
  const db = await getDb();
  await db.delete(schema.sparks).where(eq(schema.sparks.id, id));
  refresh();
}
