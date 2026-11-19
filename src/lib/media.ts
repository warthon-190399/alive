import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb, MEDIA_DIR, schema } from "@/db";
import { mediaUrl } from "./media-url";

export { mediaUrl };

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};
export const MAX_BYTES = 20 * 1024 * 1024;


export async function saveImage(bytes: Uint8Array, mime: string, date: string, source: "upload" | "web", sourceUrl?: string) {
  const ext = EXT[mime];
  if (!ext) throw new Error("Formato de imagen no soportado");
  if (bytes.byteLength > MAX_BYTES) throw new Error("La imagen supera 20 MB");
  const rel = `${date.slice(0, 4)}/${date.slice(5, 7)}/${randomUUID()}.${ext}`;
  const abs = path.join(MEDIA_DIR, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bytes);
  const db = await getDb();
  const [row] = await db
    .insert(schema.media)
    .values({ path: rel, mime, source, sourceUrl: sourceUrl ?? null, date })
    .returning();
  return { id: row.id, url: mediaUrl(rel) };
}

/** Descarga una imagen de internet y la guarda localmente (así no depende del enlace). */
export async function saveImageFromUrl(url: string, date: string) {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error("Enlace no válido");
  }
  if (!/^https?:$/.test(u.protocol)) throw new Error("Solo enlaces http(s)");
  const res = await fetch(u, { headers: { "user-agent": "alive/0.1 (personal journal)" }, redirect: "follow" });
  if (!res.ok) throw new Error(`No se pudo descargar (${res.status})`);
  const mime = (res.headers.get("content-type") || "").split(";")[0].trim();
  if (!EXT[mime]) throw new Error("El enlace no apunta a una imagen");
  const buf = new Uint8Array(await res.arrayBuffer());
  return saveImage(buf, mime, date, "web", url);
}
