import "server-only";
import { and, desc, eq, gte, like, lte } from "drizzle-orm";
import { getDb, schema } from "@/db";
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
  const images = await db.select().from(schema.media).where(like(schema.media.date, `${month}-%`)).orderBy(schema.media.date);
  const [review] = await db.select().from(schema.reviews).where(eq(schema.reviews.period, month));
  const fragCount = (await db.select({ id: schema.fragments.id }).from(schema.fragments).where(like(schema.fragments.date, `${month}-%`))).length;
  const moods: Record<string, number> = {};
  for (const e of entries) for (const m of e.moods) moods[m] = (moods[m] ?? 0) + 1;
  return {
    entries,
    images: images.map((m) => ({ id: m.id, url: mediaUrl(m.path), date: m.date })),
    review: review?.answers ?? {},
    fragCount,
    moods,
  };
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
