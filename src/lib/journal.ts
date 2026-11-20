import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, gte, inArray, like, lte } from "drizzle-orm";
import { getDb, MEDIA_DIR, schema } from "@/db";
import type { Block } from "@/db/schema";
import { addDays, monthKey } from "./dates";
import { mediaMap, mediaUrl } from "./media-url";

export { mediaMap };

export const MOODS: { name: string; color: string }[] = [
  { name: "Sereno", color: "#FF572E" },
  { name: "Agradecido", color: "#F4EADB" },
  { name: "Enfocado", color: "#F97316" },
  { name: "Pleno", color: "#E8B590" },
  { name: "Inspirado", color: "#FFB08A" },
  { name: "Cansado", color: "#6B5A4C" },
  { name: "Inquieto", color: "#A92F27" },
];
export const moodColor = (m: string) => MOODS.find((x) => x.name === m)?.color ?? "#6B5A4C";

export async function getEntry(date: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.journalEntries).where(eq(schema.journalEntries.date, date));
  return row ?? null;
}

export function entryText(blocks: Block[]) {
  return blocks
    .filter((b): b is Extract<Block, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join(" ")
    .trim();
}

export function wordCount(blocks: Block[]) {
  const t = blocks.map((b) => (b.type === "image" ? b.caption : b.text)).join(" ");
  return t.split(/\s+/).filter(Boolean).length;
}

/** Días recientes con entrada, para la columna lateral. */
export async function getRecentDays(limit = 14) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.journalEntries)
    .orderBy(desc(schema.journalEntries.date))
    .limit(limit);
  return rows.map((r) => {
    const images = r.blocks.filter((b) => b.type === "image").length;
    const quotes = r.blocks.filter((b) => b.type === "quote").length;
    const meta = [images ? `${images} foto${images > 1 ? "s" : ""}` : "", quotes ? `${quotes} cita${quotes > 1 ? "s" : ""}` : ""]
      .filter(Boolean)
      .join(" · ");
    return { date: r.date, title: r.title || entryText(r.blocks).slice(0, 40) || "Sin título", meta: meta || `${wordCount(r.blocks)} palabras`, mood: r.moods[0] };
  });
}

export async function getFragments(date: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.fragments).where(eq(schema.fragments.date, date)).orderBy(desc(schema.fragments.id));
  const map = await mediaMap(rows.map((r) => r.mediaId).filter((x): x is number => x != null));
  return rows.map((r) => ({ ...r, imageUrl: r.mediaId ? map[r.mediaId] : undefined }));
}

export async function getOneYearAgo(date: string) {
  const y = Number(date.slice(0, 4)) - 1;
  return getEntry(`${y}${date.slice(4)}`);
}

export async function getMonth(month: string) {
  const db = await getDb();
  const start = `${month}-01`;
  const end = `${month}-31`;
  const entries = await db
    .select()
    .from(schema.journalEntries)
    .where(and(gte(schema.journalEntries.date, start), lte(schema.journalEntries.date, end)))
    .orderBy(desc(schema.journalEntries.date));
  const frags = await db
    .select({ id: schema.fragments.id, mediaId: schema.fragments.mediaId, date: schema.fragments.date })
    .from(schema.fragments)
    .where(like(schema.fragments.date, `${month}-%`));
  const [review] = await db.select().from(schema.reviews).where(eq(schema.reviews.period, month));
  const fragCount = frags.length;
  const moods: Record<string, number> = {};
  for (const e of entries) for (const m of e.moods) moods[m] = (moods[m] ?? 0) + 1;
  return {
    entries,
    images: await liveImages(month, entries, frags),
    review: review?.answers ?? {},
    fragCount,
    moods,
  };
}

type MediaRef = { id: number; date?: string; order: number; href: string };

/**
 * Imágenes vigentes del mes: las que siguen en uso en alguna parte de alive.
 * - Journal: las imágenes dentro de las entradas y fragmentos del mes.
 * - Resto: portadas de proyectos, intereses, cola y experiencias, galerías de viajes
 *   y el vision board, cuando la imagen se guardó en este mes.
 * Deja fuera las huérfanas (borradas de donde estaban) y las repetidas
 * (mismo archivo subido dos veces o mismo enlace importado de nuevo).
 */
async function liveImages(
  month: string,
  entries: { date: string; blocks: Block[] }[],
  frags: { mediaId: number | null; date: string }[],
) {
  const db = await getDb();
  const s = schema;
  const [projects, board, interests, queue, exps, gallery] = await Promise.all([
    db.select({ id: s.projects.id, m: s.projects.coverMediaId }).from(s.projects),
    db.select({ m: s.boardItems.mediaId }).from(s.boardItems),
    db.select({ id: s.interests.id, m: s.interests.coverMediaId }).from(s.interests),
    db.select({ m: s.queueItems.coverMediaId, interestId: s.queueItems.interestId }).from(s.queueItems),
    db.select({ id: s.experiences.id, m: s.experiences.coverMediaId }).from(s.experiences),
    db.select({ id: s.experienceMedia.experienceId, m: s.experienceMedia.mediaId, sort: s.experienceMedia.sort }).from(s.experienceMedia),
  ]);

  // Dentro del mismo día: primero el journal, luego fragmentos, luego el resto
  const refs: MediaRef[] = [
    ...entries.flatMap((e) =>
      e.blocks.flatMap((b, i) => (b.type === "image" ? [{ id: b.mediaId, date: e.date, order: i, href: `/journal?date=${e.date}` }] : [])),
    ),
    ...frags.flatMap((f) => (f.mediaId != null ? [{ id: f.mediaId, date: f.date, order: 10_000, href: `/journal?date=${f.date}` }] : [])),
    ...projects.flatMap((p) => (p.m != null ? [{ id: p.m, order: 20_000, href: `/projects/${p.id}` }] : [])),
    ...exps.flatMap((e) => (e.m != null ? [{ id: e.m, order: 20_001, href: `/experiences/${e.id}` }] : [])),
    ...gallery.map((g) => ({ id: g.m, order: 20_002 + g.sort, href: `/experiences/${g.id}` })),
    ...interests.flatMap((i) => (i.m != null ? [{ id: i.m, order: 30_000, href: `/knowledge/${i.id}` }] : [])),
    ...queue.flatMap((q) => (q.m != null ? [{ id: q.m, order: 30_001, href: q.interestId ? `/knowledge/${q.interestId}` : "/knowledge" }] : [])),
    ...board.flatMap((b) => (b.m != null ? [{ id: b.m, order: 40_000, href: "/strategy" }] : [])),
  ];
  if (!refs.length) return [];

  const rows = await db.select().from(s.media).where(inArray(s.media.id, [...new Set(refs.map((r) => r.id))]));
  const byId = new Map(rows.map((r) => [r.id, r]));

  // El journal manda por la fecha de la entrada; el resto, por el día en que se guardó la imagen
  const inMonth = refs
    .map((r) => ({ ...r, date: r.date ?? byId.get(r.id)?.date ?? "" }))
    .filter((r) => r.date.startsWith(`${month}-`))
    .sort((a, b) => (a.date === b.date ? a.order - b.order : a.date < b.date ? -1 : 1));

  const seenIds = new Set<number>();
  const seenContent = new Set<string>();
  const out: { id: number; url: string; date: string; href: string }[] = [];
  for (const ref of inMonth) {
    const m = byId.get(ref.id);
    if (!m || seenIds.has(m.id)) continue;
    seenIds.add(m.id);
    let key: string;
    try {
      key = createHash("sha1").update(await readFile(path.join(MEDIA_DIR, m.path))).digest("hex");
    } catch {
      continue; // el archivo ya no existe en disco: no es vigente
    }
    if (seenContent.has(key) || (m.sourceUrl && seenContent.has(m.sourceUrl))) continue;
    seenContent.add(key);
    if (m.sourceUrl) seenContent.add(m.sourceUrl);
    out.push({ id: m.id, url: mediaUrl(m.path), date: ref.date, href: ref.href });
  }
  return out;
}

/** Fechas con entrada entre dos años, para la vista de década. */
export async function getEntryDates(fromYear: number, toYear: number) {
  const db = await getDb();
  const rows = await db
    .select({ date: schema.journalEntries.date })
    .from(schema.journalEntries)
    .where(and(gte(schema.journalEntries.date, `${fromYear}-01-01`), lte(schema.journalEntries.date, `${toYear}-12-31`)));
  return rows.map((r) => r.date);
}

export async function getMonthSnapshots(lastMonth: string, count: number) {
  const out = [];
  let m = lastMonth;
  for (let i = 0; i < count; i++) {
    const data = await getMonth(m);
    out.unshift({ month: m, entries: data.entries.length, photos: data.images.length, cover: data.images[0]?.url, words: data.review.palabras ?? "" });
    const [y, mm] = m.split("-").map(Number);
    m = new Date(Date.UTC(y, mm - 2, 1)).toISOString().slice(0, 7);
  }
  return out;
}

export { addDays, monthKey };
