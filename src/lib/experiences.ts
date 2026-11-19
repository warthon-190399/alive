import "server-only";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { mediaMap, mediaUrl } from "./media-url";

export const KIND_LABEL: Record<string, string> = { viaje: "Viaje", lugar: "Lugar", pelicula: "Película", libro: "Libro", concierto: "Concierto", momento: "Momento" };

export async function getExperiences() {
  const db = await getDb();
  const rows = await db.select().from(schema.experiences).orderBy(desc(schema.experiences.date), desc(schema.experiences.id));
  const covers = await mediaMap(rows.map((r) => r.coverMediaId).filter((x): x is number => x != null));
  return rows.map((r) => ({ ...r, cover: r.coverMediaId ? covers[r.coverMediaId] : undefined }));
}
export type ExperienceView = Awaited<ReturnType<typeof getExperiences>>[number];

export async function getExperience(id: number) {
  const db = await getDb();
  const [e] = await db.select().from(schema.experiences).where(eq(schema.experiences.id, id));
  if (!e) return null;
  const gallery = await db
    .select({ id: schema.media.id, path: schema.media.path })
    .from(schema.experienceMedia)
    .innerJoin(schema.media, eq(schema.media.id, schema.experienceMedia.mediaId))
    .where(eq(schema.experienceMedia.experienceId, id))
    .orderBy(asc(schema.experienceMedia.sort));
  const cover = e.coverMediaId ? (await mediaMap([e.coverMediaId]))[e.coverMediaId] : undefined;
  // Para viajes: lo que escribiste y fotografiaste esos días en el journal
  let journal: { date: string; title: string; excerpt: string }[] = [];
  let journalPhotos: { id: number; url: string; date: string }[] = [];
  if (e.kind === "viaje" && e.date) {
    const end = e.endDate ?? e.date;
    const entries = await db
      .select()
      .from(schema.journalEntries)
      .where(and(gte(schema.journalEntries.date, e.date), lte(schema.journalEntries.date, end)))
      .orderBy(asc(schema.journalEntries.date));
    journal = entries.map((j) => ({
      date: j.date,
      title: j.title,
      excerpt: j.blocks.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join(" ").slice(0, 220),
    }));
    // solo fotos que usaste en el journal esos días (entradas y fragmentos)
    const ids = new Set<number>();
    for (const j of entries) for (const b of j.blocks) if (b.type === "image") ids.add(b.mediaId);
    const frs = await db
      .select({ mediaId: schema.fragments.mediaId })
      .from(schema.fragments)
      .where(and(gte(schema.fragments.date, e.date), lte(schema.fragments.date, end)));
    for (const f of frs) if (f.mediaId) ids.add(f.mediaId);
    const photos = ids.size ? await db.select().from(schema.media).where(inArray(schema.media.id, [...ids])).orderBy(asc(schema.media.date)) : [];
    const own = new Set([...gallery.map((g) => g.id), e.coverMediaId]);
    journalPhotos = photos.filter((p) => !own.has(p.id)).map((p) => ({ id: p.id, url: mediaUrl(p.path), date: p.date }));
  }
  return { ...e, cover, gallery: gallery.map((g) => ({ id: g.id, url: mediaUrl(g.path) })), journal, journalPhotos };
}

/** Viajes que tocan un rango de fechas (para Journal · Tiempo y Overview). */
export async function getTrips() {
  const db = await getDb();
  return db
    .select({ id: schema.experiences.id, title: schema.experiences.title, date: schema.experiences.date, endDate: schema.experiences.endDate })
    .from(schema.experiences)
    .where(and(eq(schema.experiences.kind, "viaje"), eq(schema.experiences.wishlist, false)));
}
