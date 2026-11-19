import "server-only";
import { asc, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { addMonths } from "./dates";
import { mediaMap, mediaUrl } from "./media-url";

export const DEFAULT_PILLARS = [
  { name: "Salud y energía", why: "El cuerpo como base de todo lo demás: dormir, moverme, comer bien." },
  { name: "Carrera y oficio", why: "Ser excelente en lo que hago y abrir camino propio." },
  { name: "Relaciones", why: "Presencia real con familia, pareja y amigos cercanos." },
  { name: "Creatividad", why: "Escribir, visualizar y publicar lo que pienso." },
  { name: "Finanzas", why: "Libertad para elegir: ahorro, inversión y orden." },
  { name: "Mente y aprendizaje", why: "Aprender por placer: historia, economía, filosofía." },
];

export const HORIZONS = [
  { k: "trimestre", l: "Este trimestre" },
  { k: "año", l: "Este año" },
  { k: "vision", l: "Visión" },
] as const;

export async function getVision() {
  const db = await getDb();
  const [v] = await db.select().from(schema.vision).where(eq(schema.vision.id, 1));
  return v ?? { id: 1, statement: "", year: new Date().getFullYear() + 4, values: [] as string[], updatedAt: "" };
}

export async function getPillars(month: string) {
  const db = await getDb();
  const pillars = await db.select().from(schema.pillars).where(eq(schema.pillars.archived, false)).orderBy(asc(schema.pillars.sort), asc(schema.pillars.id));
  const prev = addMonths(month, -1);
  const scores = await db.select().from(schema.pillarScores).where(inArray(schema.pillarScores.month, [month, prev]));
  const goals = await db.select({ pillarId: schema.goals.pillarId }).from(schema.goals).where(eq(schema.goals.status, "activo"));
  return pillars.map((p) => {
    const now = scores.find((s) => s.pillarId === p.id && s.month === month)?.score ?? null;
    const before = scores.find((s) => s.pillarId === p.id && s.month === prev)?.score ?? null;
    return { ...p, score: now, delta: now != null && before != null ? now - before : null, goals: goals.filter((g) => g.pillarId === p.id).length };
  });
}

export async function getPillarNames() {
  const db = await getDb();
  const rows = await db.select({ name: schema.pillars.name }).from(schema.pillars).where(eq(schema.pillars.archived, false)).orderBy(asc(schema.pillars.sort), asc(schema.pillars.id));
  return rows.map((r) => r.name);
}

type TaskLite = { projectId: number; status: string };
type MsLite = { projectId: number; done: boolean };

export function computeProgress(projectId: number, tasks: TaskLite[], ms: MsLite[]) {
  const t = tasks.filter((x) => x.projectId === projectId);
  if (t.length) return Math.round((t.filter((x) => x.status === "hecho").length / t.length) * 100);
  const m = ms.filter((x) => x.projectId === projectId);
  if (m.length) return Math.round((m.filter((x) => x.done).length / m.length) * 100);
  return 0;
}

/** Proyectos con su objetivo, pilar, progreso, hitos y portada. */
export async function getProjects() {
  const db = await getDb();
  const projects = await db.select().from(schema.projects).orderBy(desc(schema.projects.focus), asc(schema.projects.due), desc(schema.projects.id));
  const tasks = await db.select({ id: schema.tasks.id, projectId: schema.tasks.projectId, status: schema.tasks.status, title: schema.tasks.title, sort: schema.tasks.sort }).from(schema.tasks);
  const ms = await db.select().from(schema.milestones).orderBy(asc(schema.milestones.due), asc(schema.milestones.sort));
  const goals = await db.select().from(schema.goals);
  const pillars = await db.select().from(schema.pillars);
  const covers = await mediaMap(projects.map((p) => p.coverMediaId).filter((x): x is number => x != null));
  return projects.map((p) => {
    const goal = goals.find((g) => g.id === p.goalId);
    const pillar = pillars.find((x) => x.id === goal?.pillarId);
    const pt = tasks.filter((t) => t.projectId === p.id);
    const pm = ms.filter((m) => m.projectId === p.id);
    const nextTask = pt.filter((t) => t.status === "en_curso").sort((a, b) => a.sort - b.sort)[0] ?? pt.find((t) => t.status === "ideas");
    return {
      ...p,
      goal: goal ? { id: goal.id, title: goal.title } : null,
      pillar: pillar ? { id: pillar.id, name: pillar.name } : null,
      progress: computeProgress(p.id, tasks, ms),
      openTasks: pt.filter((t) => t.status !== "hecho").length,
      nextTask: nextTask?.title ?? null,
      milestones: pm,
      nextMilestone: pm.find((m) => !m.done) ?? null,
      cover: p.coverMediaId ? covers[p.coverMediaId] : undefined,
    };
  });
}
export type ProjectView = Awaited<ReturnType<typeof getProjects>>[number];

export async function getGoals() {
  const db = await getDb();
  const goals = await db.select().from(schema.goals).where(ne(schema.goals.status, "soltado")).orderBy(asc(schema.goals.sort), asc(schema.goals.id));
  const pillars = await db.select().from(schema.pillars);
  const projects = await db.select({ id: schema.projects.id, goalId: schema.projects.goalId }).from(schema.projects);
  const tasks = await db.select({ projectId: schema.tasks.projectId, status: schema.tasks.status }).from(schema.tasks);
  const ms = await db.select({ projectId: schema.milestones.projectId, done: schema.milestones.done }).from(schema.milestones);
  return goals.map((g) => {
    const linked = projects.filter((p) => p.goalId === g.id);
    const derived = linked.length ? Math.round(linked.reduce((a, p) => a + computeProgress(p.id, tasks, ms), 0) / linked.length) : null;
    return {
      ...g,
      pillarName: pillars.find((p) => p.id === g.pillarId)?.name ?? null,
      projects: linked.length,
      shownProgress: g.status === "logrado" ? 100 : derived ?? g.progress,
      derived: derived != null,
    };
  });
}
export type GoalView = Awaited<ReturnType<typeof getGoals>>[number];

export async function getBoard() {
  const db = await getDb();
  const items = await db.select().from(schema.boardItems).orderBy(desc(schema.boardItems.id));
  const m = await mediaMap(items.map((i) => i.mediaId).filter((x): x is number => x != null));
  return items.map((i) => ({ id: i.id, kind: i.kind, text: i.text, url: i.mediaId ? m[i.mediaId] : undefined }));
}

export { mediaUrl };
