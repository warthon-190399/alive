"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { EXPERIENCE_KINDS } from "@/db/schema";
import { isValidISODate, localNow, today } from "@/lib/dates";
import { failure, type Result } from "@/lib/result";

type Kind = (typeof EXPERIENCE_KINDS)[number];
const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const optDate = (v: unknown) => (isValidISODate(v) ? v : null);
const optNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const rating = (v: unknown) => (typeof v === "number" && v >= 1 && v <= 5 ? Math.round(v) : null);

function refresh(id?: number) {
  revalidatePath("/experiences");
  if (id) revalidatePath(`/experiences/${id}`);
  revalidatePath("/journal/tiempo");
  revalidatePath("/");
}

export type ExperienceInput = {
  kind: Kind;
  title: string;
  date: string | null;
  endDate: string | null;
  rating: number | null;
  note: string;
  withWhom: string;
  place: string;
  lat: number | null;
  lng: number | null;
  coverMediaId: number | null;
  wishlist: boolean;
};

export async function createExperience(d: ExperienceInput): Promise<Result<{ id: number }>> {
  const title = str(d.title, 200);
  if (!title) return { ok: false, error: "Ponle un título" };
  const kind = EXPERIENCE_KINDS.includes(d.kind) ? d.kind : "momento";
  const db = await getDb();
  const [row] = await db
    .insert(schema.experiences)
    .values({
      kind,
      title,
      date: d.wishlist ? null : (optDate(d.date) ?? today()),
      endDate: kind === "viaje" && !d.wishlist ? optDate(d.endDate) : null,
      rating: d.wishlist ? null : rating(d.rating),
      note: str(d.note, 10000),
      withWhom: str(d.withWhom, 200),
      place: str(d.place, 200),
      lat: optNum(d.lat),
      lng: optNum(d.lng),
      coverMediaId: d.coverMediaId,
      wishlist: !!d.wishlist,
      createdAt: localNow(),
    })
    .returning({ id: schema.experiences.id });
  refresh();
  return { ok: true, id: row.id };
}

export async function updateExperience(id: number, p: Partial<ExperienceInput>) {
  const db = await getDb();
  const set: Partial<typeof schema.experiences.$inferInsert> = {};
  if (p.title !== undefined && str(p.title, 200)) set.title = str(p.title, 200);
  if (p.kind && EXPERIENCE_KINDS.includes(p.kind)) set.kind = p.kind;
  if (p.date !== undefined) set.date = optDate(p.date);
  if (p.endDate !== undefined) set.endDate = optDate(p.endDate);
  if (p.rating !== undefined) set.rating = rating(p.rating);
  if (p.note !== undefined) set.note = String(p.note).slice(0, 10000);
  if (p.withWhom !== undefined) set.withWhom = str(p.withWhom, 200);
  if (p.place !== undefined) set.place = str(p.place, 200);
  if (p.lat !== undefined) set.lat = optNum(p.lat);
  if (p.lng !== undefined) set.lng = optNum(p.lng);
  if (p.coverMediaId !== undefined) set.coverMediaId = p.coverMediaId;
  if (p.wishlist !== undefined) set.wishlist = p.wishlist;
  if (Object.keys(set).length) await db.update(schema.experiences).set(set).where(eq(schema.experiences.id, id));
  refresh(id);
}

/** Algo de la lista de deseos que por fin viviste. */
export async function markLived(id: number) {
  const db = await getDb();
  await db.update(schema.experiences).set({ wishlist: false, date: today() }).where(eq(schema.experiences.id, id));
  refresh(id);
}

export async function deleteExperience(id: number) {
  const db = await getDb();
  await db.update(schema.queueItems).set({ experienceId: null }).where(eq(schema.queueItems.experienceId, id));
  await db.delete(schema.experiences).where(eq(schema.experiences.id, id));
  refresh();
}

export async function addToGallery(experienceId: number, mediaId: number) {
  const db = await getDb();
  const [{ m }] = await db.select({ m: max(schema.experienceMedia.sort) }).from(schema.experienceMedia).where(eq(schema.experienceMedia.experienceId, experienceId));
  await db.insert(schema.experienceMedia).values({ experienceId, mediaId, sort: (m ?? 0) + 1 }).onConflictDoNothing();
  refresh(experienceId);
}

export async function removeFromGallery(experienceId: number, mediaId: number) {
  const db = await getDb();
  await db.delete(schema.experienceMedia).where(and(eq(schema.experienceMedia.experienceId, experienceId), eq(schema.experienceMedia.mediaId, mediaId)));
  refresh(experienceId);
}

/** Busca un lugar por nombre (OpenStreetMap · Nominatim). Necesita internet. */
type Place = { label: string; short: string; lat: number; lng: number };
export async function geocode(query: string): Promise<Result<{ results: Place[] }>> {
  const q = str(query, 200);
  if (!q) return { ok: true, results: [] };
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=es&q=${encodeURIComponent(q)}`, {
      headers: { "user-agent": "alive-personal-journal/0.1 (uso personal local)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error();
    const data = (await res.json()) as { display_name: string; lat: string; lon: string; name?: string }[];
    return { ok: true, results: data.map((d) => ({ label: d.display_name, short: d.name || d.display_name.split(",")[0], lat: Number(d.lat), lng: Number(d.lon) })) };
  } catch (e) {
    void failure(e);
    return { ok: false, error: "No se pudo buscar el lugar. ¿Hay conexión a internet?" };
  }
}
