"use server";

import { isValidISODate, today } from "@/lib/dates";
import { saveImage, saveImageFromUrl } from "@/lib/media";
import { failure, type Result } from "@/lib/result";

type Img = Result<{ id: number; url: string }>;

/** Sube una imagen (portadas, galerías). */
export async function uploadMedia(formData: FormData): Promise<Img> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) throw new Error("No llegó ninguna imagen");
    const d = formData.get("date");
    return { ok: true, ...(await saveImage(new Uint8Array(await file.arrayBuffer()), file.type, isValidISODate(d) ? d : today(), "upload")) };
  } catch (e) {
    return failure(e);
  }
}

/** Descarga una imagen desde un enlace y la guarda localmente. */
export async function importMedia(url: string, date?: string): Promise<Img> {
  try {
    return { ok: true, ...(await saveImageFromUrl(String(url).trim(), isValidISODate(date) ? date : today())) };
  } catch (e) {
    return failure(e);
  }
}
