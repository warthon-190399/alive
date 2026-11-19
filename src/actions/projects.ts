"use server";

import { and, eq, max, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { TASK_STATUSES } from "@/db/schema";
import { isValidISODate, localNow, today } from "@/lib/dates";
import { saveImage } from "@/lib/media";
import { failure, type Result } from "@/lib/result";

type TaskStatus = (typeof TASK_STATUSES)[number];
const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const optDate = (v: unknown) => (isValidISODate(v) ? v : null);

function refresh(projectId?: number) {
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  revalidatePath("/strategy");
  revalidatePath("/");
}

export async function createProject(formData: FormData) {
  const name = str(formData.get("name"), 120);
  if (!name) return;
  const db = await getDb();
  const [row] = await db
    .insert(schema.projects)
    .values({
      name,
      goalId: Number(formData.get("goalId")) || null,
      start: optDate(formData.get("start")) ?? today(),
      due: optDate(formData.get("due")),
      createdAt: localNow(),
    })
    .returning({ id: schema.projects.id });
  refresh();
  redirect(`/projects/${row.id}`);
}

type ProjectPatch = {
  name?: string;
  description?: string;
  goalId?: number | null;
  status?: "idea" | "activo" | "pausado" | "hecho";
  start?: string | null;
  due?: string | null;
  focus?: boolean;
};

export async function updateProject(id: number, patch: ProjectPatch) {
  const db = await getDb();
  const set: Partial<typeof schema.projects.$inferInsert> = {};
  if (patch.name !== undefined && str(patch.name, 120)) set.name = str(patch.name, 120);
  if (patch.description !== undefined) set.description = String(patch.description).slice(0, 20000);
  if (patch.goalId !== undefined) set.goalId = patch.goalId;
  if (patch.status && ["idea", "activo", "pausado", "hecho"].includes(patch.status)) set.status = patch.status;
  if (patch.start !== undefined) set.start = optDate(patch.start);
  if (patch.due !== undefined) set.due = optDate(patch.due);
  if (patch.focus !== undefined) {
    set.focus = patch.focus;
    // solo un proyecto en foco a la vez
    if (patch.focus) await db.update(schema.projects).set({ focus: false }).where(ne(schema.projects.id, id));
  }
  if (Object.keys(set).length) await db.update(schema.projects).set(set).where(eq(schema.projects.id, id));
  refresh(id);
}

export async function deleteProject(id: number) {
  const db = await getDb();
  await db.delete(schema.projects).where(eq(schema.projects.id, id));
  refresh();
  redirect("/projects");
}

export async function setProjectCover(formData: FormData): Promise<Result<{ url: string }>> {
  try {
    const id = Number(formData.get("projectId"));
    const file = formData.get("file");
    if (!id || !(file instanceof File) || !file.size) throw new Error("No llegó ninguna imagen");
    const img = await saveImage(new Uint8Array(await file.arrayBuffer()), file.type, today(), "upload");
    const db = await getDb();
    await db.update(schema.projects).set({ coverMediaId: img.id }).where(eq(schema.projects.id, id));
    refresh(id);
    return { ok: true, url: img.url };
  } catch (e) {
    return failure(e);
  }
}

/* Tareas */
export async function createTask(projectId: number, title: string, status: TaskStatus = "ideas") {
  const t = str(title, 300);
  if (!t) return null;
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(schema.tasks.sort) }).from(schema.tasks).where(eq(schema.tasks.projectId, projectId));
  const [row] = await db
    .insert(schema.tasks)
    .values({ projectId, title: t, status: TASK_STATUSES.includes(status) ? status : "ideas", sort: (m ?? 0) + 1, createdAt: localNow() })
    .returning();
  refresh(projectId);
  return row;
}

export async function moveTask(id: number, status: TaskStatus) {
  if (!TASK_STATUSES.includes(status)) return;
  const db = await getDb();
  const [t] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
  if (!t) return;
  const [{ m }] = await db
    .select({ m: max(schema.tasks.sort) })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.projectId, t.projectId), eq(schema.tasks.status, status)));
  await db.update(schema.tasks).set({ status, sort: (m ?? 0) + 1 }).where(eq(schema.tasks.id, id));
  refresh(t.projectId);
}

export async function deleteTask(id: number) {
  const db = await getDb();
  const [t] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  refresh(t?.projectId);
}

/* Hitos */
export async function createMilestone(formData: FormData) {
  const projectId = Number(formData.get("projectId"));
  const title = str(formData.get("title"), 200);
  if (!projectId || !title) return;
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(schema.milestones.sort) }).from(schema.milestones).where(eq(schema.milestones.projectId, projectId));
  await db.insert(schema.milestones).values({ projectId, title, due: optDate(formData.get("due")), sort: (m ?? 0) + 1 });
  refresh(projectId);
}

export async function toggleMilestone(id: number, done: boolean) {
  const db = await getDb();
  const [m] = await db.update(schema.milestones).set({ done }).where(eq(schema.milestones.id, id)).returning();
  refresh(m?.projectId);
}

export async function deleteMilestone(id: number) {
  const db = await getDb();
  const [m] = await db.delete(schema.milestones).where(eq(schema.milestones.id, id)).returning();
  refresh(m?.projectId);
}
