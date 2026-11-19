"use server";

import { eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { isValidISODate, localNow, today } from "@/lib/dates";
import { saveImage } from "@/lib/media";
import { DEFAULT_PILLARS } from "@/lib/strategy";

function refresh() {
  revalidatePath("/strategy");
  revalidatePath("/projects", "layout");
  revalidatePath("/");
  revalidatePath("/habits");
}

const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const optDate = (v: unknown) => (isValidISODate(v) ? v : null);

/* Visión */
export async function saveVision(data: { statement: string; year: number; values: string[] }) {
  const db = await getDb();
  const values = {
    id: 1,
    statement: str(data.statement, 2000),
    year: Math.min(2100, Math.max(2000, Number(data.year) || new Date().getFullYear() + 4)),
    values: (Array.isArray(data.values) ? data.values : []).map((v) => str(v, 40)).filter(Boolean).slice(0, 8),
    updatedAt: localNow(),
  };
  await db.insert(schema.vision).values(values).onConflictDoUpdate({ target: schema.vision.id, set: values });
  revalidatePath("/strategy");
  revalidatePath("/");
}

/* Pilares */
export async function seedPillars() {
  const db = await getDb();
  const existing = await db.select({ id: schema.pillars.id }).from(schema.pillars);
  if (existing.length) return;
  await db.insert(schema.pillars).values(DEFAULT_PILLARS.map((p, i) => ({ ...p, sort: i, createdAt: localNow() })));
  refresh();
}

export async function createPillar(formData: FormData) {
  const name = str(formData.get("name"), 60);
  if (!name) return;
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(schema.pillars.sort) }).from(schema.pillars);
  await db.insert(schema.pillars).values({ name, why: str(formData.get("why"), 300), sort: (m ?? 0) + 1, createdAt: localNow() });
  refresh();
}

export async function updatePillar(id: number, patch: { name?: string; why?: string }) {
  const db = await getDb();
  const set: { name?: string; why?: string } = {};
  if (patch.name !== undefined && str(patch.name, 60)) set.name = str(patch.name, 60);
  if (patch.why !== undefined) set.why = str(patch.why, 300);
  if (Object.keys(set).length) await db.update(schema.pillars).set(set).where(eq(schema.pillars.id, id));
  refresh();
}

export async function archivePillar(id: number) {
  const db = await getDb();
  await db.update(schema.pillars).set({ archived: true }).where(eq(schema.pillars.id, id));
  refresh();
}

export async function setPillarScore(id: number, month: string, score: number) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Mes inválido");
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const db = await getDb();
  await db
    .insert(schema.pillarScores)
    .values({ pillarId: id, month, score: s })
    .onConflictDoUpdate({ target: [schema.pillarScores.pillarId, schema.pillarScores.month], set: { score: s } });
  revalidatePath("/strategy");
  revalidatePath("/");
}

/* Objetivos */
export async function createGoal(formData: FormData) {
  const title = str(formData.get("title"), 200);
  if (!title) return;
  const horizon = String(formData.get("horizon"));
  const pillarId = Number(formData.get("pillarId")) || null;
  const db = await getDb();
  await db.insert(schema.goals).values({
    title,
    pillarId,
    horizon: horizon === "año" || horizon === "vision" ? horizon : "trimestre",
    due: optDate(formData.get("due")),
    createdAt: localNow(),
  });
  refresh();
}

export async function updateGoal(id: number, patch: { title?: string; progress?: number; status?: "activo" | "logrado" | "soltado"; pillarId?: number | null }) {
  const db = await getDb();
  const set: Partial<typeof schema.goals.$inferInsert> = {};
  if (patch.title !== undefined && str(patch.title, 200)) set.title = str(patch.title, 200);
  if (patch.progress !== undefined) set.progress = Math.max(0, Math.min(100, Math.round(patch.progress)));
  if (patch.status && ["activo", "logrado", "soltado"].includes(patch.status)) set.status = patch.status;
  if (patch.pillarId !== undefined) set.pillarId = patch.pillarId;
  if (Object.keys(set).length) await db.update(schema.goals).set(set).where(eq(schema.goals.id, id));
  refresh();
}

export async function deleteGoal(id: number) {
  const db = await getDb();
  await db.delete(schema.goals).where(eq(schema.goals.id, id));
  refresh();
}

/* Vision board */
export async function addBoardImage(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) throw new Error("No llegó ninguna imagen");
  const img = await saveImage(new Uint8Array(await file.arrayBuffer()), file.type, today(), "upload");
  const db = await getDb();
  await db.insert(schema.boardItems).values({ kind: "image", mediaId: img.id, createdAt: localNow() });
  revalidatePath("/strategy");
}

export async function addBoardText(text: string) {
  const t = str(text, 200);
  if (!t) return;
  const db = await getDb();
  await db.insert(schema.boardItems).values({ kind: "text", text: t, createdAt: localNow() });
  revalidatePath("/strategy");
}

export async function deleteBoardItem(id: number) {
  const db = await getDb();
  await db.delete(schema.boardItems).where(eq(schema.boardItems.id, id));
  revalidatePath("/strategy");
}
