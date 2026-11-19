import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const createdAt = () =>
  text("created_at").notNull().default(sql`(datetime('now'))`);

/** Imágenes guardadas en data/media (subidas o descargadas desde la web). */
export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  path: text("path").notNull(), // relativo a data/media, p. ej. 2026/11/abc.jpg
  mime: text("mime").notNull(),
  source: text("source", { enum: ["upload", "web"] }).notNull(),
  sourceUrl: text("source_url"),
  date: text("date").notNull(), // YYYY-MM-DD del día al que pertenece
  createdAt: createdAt(),
});

export type Block =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; mediaId: number; caption: string }
  | { id: string; type: "quote"; text: string; source: string };

/** Una entrada de journal por día. */
export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  title: text("title").notNull().default(""),
  blocks: text("blocks", { mode: "json" }).$type<Block[]>().notNull().default(sql`'[]'`),
  moods: text("moods", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  location: text("location").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

/** Fragmentos sueltos del día: notas rápidas, gratitud, recuerdos, imágenes web. */
export const fragments = sqliteTable("fragments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  kind: text("kind", { enum: ["nota", "gratitud", "recuerdo", "web"] }).notNull(),
  text: text("text").notNull().default(""),
  mediaId: integer("media_id").references(() => media.id),
  url: text("url"),
  createdAt: createdAt(),
});

/** Revisiones periódicas (por ahora mensuales: period = YYYY-MM). */
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  period: text("period").notNull().unique(),
  answers: text("answers", { mode: "json" }).$type<Record<string, string>>().notNull().default(sql`'{}'`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const habits = sqliteTable("habits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  pillar: text("pillar").notNull().default(""),
  timeHint: text("time_hint").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const habitLogs = sqliteTable(
  "habit_logs",
  {
    habitId: integer("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
  },
  (t) => [primaryKey({ columns: [t.habitId, t.date] })],
);

/** Las prioridades del día que aparecen en Overview. */
export const priorities = sqliteTable("priorities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  title: text("title").notNull(),
  area: text("area").notNull().default(""),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

/* ───────────── Fase 2: Strategy + Projects ───────────── */

/** Visión de vida: una sola fila (id = 1). */
export const vision = sqliteTable("vision", {
  id: integer("id").primaryKey(),
  statement: text("statement").notNull().default(""),
  year: integer("year").notNull().default(2030),
  values: text("values", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

/** Pilares o áreas de vida. */
export const pillars = sqliteTable("pillars", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  why: text("why").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

/** Cómo te sientes en cada pilar, mes a mes (0–100). */
export const pillarScores = sqliteTable(
  "pillar_scores",
  {
    pillarId: integer("pillar_id")
      .notNull()
      .references(() => pillars.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // YYYY-MM
    score: integer("score").notNull(),
  },
  (t) => [primaryKey({ columns: [t.pillarId, t.month] })],
);

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  pillarId: integer("pillar_id").references(() => pillars.id, { onDelete: "set null" }),
  horizon: text("horizon", { enum: ["trimestre", "año", "vision"] }).notNull().default("trimestre"),
  due: text("due"),
  progress: integer("progress").notNull().default(0), // manual, si no tiene proyectos
  status: text("status", { enum: ["activo", "logrado", "soltado"] }).notNull().default("activo"),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "set null" }),
  status: text("status", { enum: ["idea", "activo", "pausado", "hecho"] }).notNull().default("activo"),
  focus: integer("focus", { mode: "boolean" }).notNull().default(false),
  coverMediaId: integer("cover_media_id").references(() => media.id, { onDelete: "set null" }),
  start: text("start"),
  due: text("due"),
  createdAt: createdAt(),
});

export const TASK_STATUSES = ["ideas", "en_curso", "revision", "hecho"] as const;

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status", { enum: TASK_STATUSES }).notNull().default("ideas"),
  due: text("due"),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
});

export const milestones = sqliteTable("milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  due: text("due"),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

/** Vision board: imágenes y frases. */
export const boardItems = sqliteTable("board_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["image", "text"] }).notNull(),
  mediaId: integer("media_id").references(() => media.id, { onDelete: "cascade" }),
  text: text("text").notNull().default(""),
  createdAt: createdAt(),
});

/* ───────────── Fase 3: Knowledge + Experiences ───────────── */

export const INTEREST_STAGES = ["curiosidad", "explorando", "profundizando"] as const;

/** Territorios de interés. */
export const interests = sqliteTable("interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  question: text("question").notNull().default(""),
  stage: text("stage", { enum: INTEREST_STAGES }).notNull().default("curiosidad"),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  sort: integer("sort").notNull().default(0),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
  stageChangedAt: text("stage_changed_at"),
  coverMediaId: integer("cover_media_id").references(() => media.id, { onDelete: "set null" }),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  interestId: integer("interest_id").references(() => interests.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  status: text("status", { enum: ["abierta", "cerrada"] }).notNull().default("abierta"),
  conclusion: text("conclusion").notNull().default(""),
  createdAt: createdAt(),
  closedAt: text("closed_at"),
});

export const QUEUE_KINDS = ["libro", "curso", "paper", "video", "podcast", "articulo"] as const;
export const QUEUE_STATUSES = ["cola", "explorando", "terminado", "abandonado"] as const;

/** Cola de exploración: lo que quieres leer, ver o estudiar. */
export const queueItems = sqliteTable("queue_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author").notNull().default(""),
  kind: text("kind", { enum: QUEUE_KINDS }).notNull().default("libro"),
  url: text("url"),
  coverMediaId: integer("cover_media_id").references(() => media.id, { onDelete: "set null" }),
  interestId: integer("interest_id").references(() => interests.id, { onDelete: "set null" }),
  status: text("status", { enum: QUEUE_STATUSES }).notNull().default("cola"),
  experienceId: integer("experience_id"),
  createdAt: createdAt(),
  finishedAt: text("finished_at"),
});

/** Chispas: ideas y enlaces sueltos. */
export const sparks = sqliteTable("sparks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["idea", "enlace", "video"] }).notNull().default("idea"),
  text: text("text").notNull(),
  url: text("url"),
  interestId: integer("interest_id").references(() => interests.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const EXPERIENCE_KINDS = ["viaje", "lugar", "pelicula", "libro", "concierto", "momento"] as const;

export const experiences = sqliteTable("experiences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: EXPERIENCE_KINDS }).notNull(),
  title: text("title").notNull(),
  date: text("date"), // inicio (o fecha) — null en la lista de deseos
  endDate: text("end_date"), // solo viajes
  rating: integer("rating"), // 1–5
  note: text("note").notNull().default(""),
  withWhom: text("with_whom").notNull().default(""),
  place: text("place").notNull().default(""),
  lat: real("lat"),
  lng: real("lng"),
  coverMediaId: integer("cover_media_id").references(() => media.id, { onDelete: "set null" }),
  wishlist: integer("wishlist", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

/** Galería de una experiencia (sobre todo viajes). */
export const experienceMedia = sqliteTable(
  "experience_media",
  {
    experienceId: integer("experience_id")
      .notNull()
      .references(() => experiences.id, { onDelete: "cascade" }),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.experienceId, t.mediaId] })],
);
